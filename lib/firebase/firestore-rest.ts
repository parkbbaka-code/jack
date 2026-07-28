import { getFirebaseServiceAccount } from "@/lib/firebase/credentials";
import { getGoogleAccessToken } from "@/lib/firebase/google-access-token";
import {
  EDIT_WINDOW_MIN,
  PAPER_TTL_DAYS,
  RECENT_LIMIT,
  REPORT_THRESHOLD,
  TEXT_LIMIT,
} from "@/constants/wishes";
import { assignWishSlot } from "@/lib/wishes/slots";
import type { MyWishView, WishTreeStatsView, WishView } from "@/types/models";
import { nanoid } from "nanoid";

export class WishError extends Error {
  constructor(
    public readonly reason:
      | "free-paper-used"
      | "duplicate-report"
      | "edit-window-closed"
      | "edit-limit-reached"
      | "not-found"
      | "forbidden"
      | "service-error",
    message: string,
  ) {
    super(message);
  }
}

type FirestoreValue = {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  nullValue?: null;
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

type FirestoreDocument = {
  name?: string;
  fields?: Record<string, FirestoreValue>;
};

function stringField(fields: Record<string, FirestoreValue>, key: string) {
  return fields[key]?.stringValue ?? "";
}

function numberField(fields: Record<string, FirestoreValue>, key: string) {
  const value = fields[key];
  return Number(value?.integerValue ?? value?.doubleValue ?? 0);
}

function booleanField(fields: Record<string, FirestoreValue>, key: string) {
  return fields[key]?.booleanValue ?? false;
}

function nullableStringField(
  fields: Record<string, FirestoreValue>,
  key: string,
) {
  return fields[key]?.nullValue === null
    ? null
    : (fields[key]?.stringValue ?? null);
}

function nullableTimestampField(
  fields: Record<string, FirestoreValue>,
  key: string,
) {
  return fields[key]?.timestampValue ?? null;
}

function wishFromDocument(
  document: FirestoreDocument,
  viewerId: string | null,
): WishView | null {
  const fields = document.fields;
  if (!fields) return null;

  const wishId = stringField(fields, "wishId");
  const ownerId = stringField(fields, "ownerId");
  const slotFields = fields.slot?.mapValue?.fields;
  const expiresAt = fields.expiresAt?.timestampValue;
  const isPublic = booleanField(fields, "isPublic");

  if (
    !wishId ||
    !ownerId ||
    !slotFields ||
    !expiresAt ||
    booleanField(fields, "hidden") ||
    fields.takenDownAt?.nullValue !== null ||
    new Date(expiresAt).getTime() <= Date.now()
  ) {
    return null;
  }

  const canReadText = isPublic || viewerId === ownerId;

  return {
    wishId,
    ownerId,
    displayName: canReadText
      ? nullableStringField(fields, "displayName")
      : null,
    text: canReadText ? stringField(fields, "text") : "",
    tier: "paper",
    isPublic,
    anonymous: booleanField(fields, "anonymous"),
    fulfilled: booleanField(fields, "fulfilled"),
    slot: {
      x: numberField(slotFields, "x"),
      y: numberField(slotFields, "y"),
      rot: numberField(slotFields, "rot"),
    },
    shareId: stringField(fields, "shareId"),
    createdAt: fields.createdAt?.timestampValue ?? new Date(0).toISOString(),
  };
}

function myWishFromDocument(document: FirestoreDocument): MyWishView | null {
  const fields = document.fields;
  if (!fields) return null;

  const wishId = stringField(fields, "wishId");
  const ownerId = stringField(fields, "ownerId");
  const slotFields = fields.slot?.mapValue?.fields;
  const expiresAt = fields.expiresAt?.timestampValue;
  const editableUntil = fields.editableUntil?.timestampValue;
  if (!wishId || !ownerId || !slotFields || !expiresAt || !editableUntil) {
    return null;
  }

  return {
    wishId,
    ownerId,
    displayName: nullableStringField(fields, "displayName"),
    text: stringField(fields, "text"),
    tier: "paper",
    isPublic: booleanField(fields, "isPublic"),
    anonymous: booleanField(fields, "anonymous"),
    fulfilled: booleanField(fields, "fulfilled"),
    hidden: booleanField(fields, "hidden"),
    takenDownAt: nullableTimestampField(fields, "takenDownAt"),
    expiresAt,
    editableUntil,
    editCount: numberField(fields, "editCount"),
    slot: {
      x: numberField(slotFields, "x"),
      y: numberField(slotFields, "y"),
      rot: numberField(slotFields, "rot"),
    },
    shareId: stringField(fields, "shareId"),
    createdAt: fields.createdAt?.timestampValue ?? new Date(0).toISOString(),
  };
}

async function beginTransaction(databaseName: string) {
  const response = await authorizedFirestoreFetch(
    `${databaseName}/documents:beginTransaction`,
    {
      method: "POST",
      body: JSON.stringify({ options: { readWrite: {} } }),
    },
  );
  const result = (await response.json()) as { transaction?: string };

  if (!response.ok || !result.transaction) {
    throw new WishError("service-error", "Could not begin transaction.");
  }

  return result.transaction;
}

async function rollbackTransaction(databaseName: string, transaction: string) {
  await authorizedFirestoreFetch(`${databaseName}/documents:rollback`, {
    method: "POST",
    body: JSON.stringify({ transaction }),
  }).catch(() => undefined);
}

async function authorizedFirestoreFetch(path: string, init?: RequestInit) {
  const accessToken = await getGoogleAccessToken();

  return fetch(`https://firestore.googleapis.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export async function createPublicWish(input: {
  ownerId: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  provider: "kakao" | "google";
  text: string;
  anonymous: boolean;
  isPublic: boolean;
}) {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const wishId = crypto.randomUUID();
  const now = new Date();
  const timestamp = now.toISOString();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const expiresAt = new Date(
    now.getTime() + PAPER_TTL_DAYS * 86_400_000,
  ).toISOString();
  const editableUntil = new Date(
    now.getTime() + EDIT_WINDOW_MIN * 60_000,
  ).toISOString();
  const userName = `${databaseName}/documents/users/${input.ownerId}`;
  const begin = await authorizedFirestoreFetch(
    `${databaseName}/documents:beginTransaction`,
    {
      method: "POST",
      body: JSON.stringify({ options: { readWrite: {} } }),
    },
  );
  const result = (await begin.json()) as { transaction?: string };
  const transaction = result.transaction;

  if (!begin.ok || !transaction) {
    throw new WishError("service-error", "Could not begin transaction.");
  }

  let committed = false;

  try {
    const userResponse = await authorizedFirestoreFetch(
      `${userName}?transaction=${encodeURIComponent(transaction)}`,
    );
    const user =
      userResponse.status === 404
        ? null
        : ((await userResponse.json()) as {
            fields?: Record<string, { stringValue?: string }>;
          });

    if (!userResponse.ok && userResponse.status !== 404) {
      throw new WishError("service-error", "Could not read user.");
    }

    if (user?.fields?.freePaperMonth?.stringValue === month) {
      throw new WishError(
        "free-paper-used",
        "Free paper already used this month.",
      );
    }

    const slot = assignWishSlot(wishId);
    const shareId = nanoid(10);
    const text = Array.from(input.text.trim())
      .slice(0, TEXT_LIMIT.paper)
      .join("");
    const userFields = {
      uid: { stringValue: input.ownerId },
      displayName: { stringValue: input.displayName.slice(0, 60) },
      email: input.email ? { stringValue: input.email } : { nullValue: null },
      photoURL: input.photoURL
        ? { stringValue: input.photoURL }
        : { nullValue: null },
      provider: { stringValue: input.provider },
      freePaperMonth: { stringValue: month },
      updatedAt: { timestampValue: timestamp },
      ...(user ? {} : { createdAt: { timestampValue: timestamp } }),
    };
    const userFieldPaths = Object.keys(userFields);
    const response = await authorizedFirestoreFetch(
      `${databaseName}/documents:commit`,
      {
        method: "POST",
        body: JSON.stringify({
          transaction,
          writes: [
            {
              update: {
                name: `${databaseName}/documents/wishes/${wishId}`,
                fields: {
                  wishId: { stringValue: wishId },
                  ownerId: { stringValue: input.ownerId },
                  displayName: input.anonymous
                    ? { nullValue: null }
                    : { stringValue: input.displayName.slice(0, 60) },
                  text: { stringValue: text },
                  tier: { stringValue: "paper" },
                  variant: { nullValue: null },
                  engraving: { nullValue: null },
                  isPublic: { booleanValue: input.isPublic },
                  anonymous: { booleanValue: input.anonymous },
                  fulfilled: { booleanValue: false },
                  fulfilledAt: { nullValue: null },
                  reportCount: { integerValue: "0" },
                  hidden: { booleanValue: false },
                  takenDownAt: { nullValue: null },
                  expiresAt: { timestampValue: expiresAt },
                  editableUntil: { timestampValue: editableUntil },
                  editCount: { integerValue: "0" },
                  slot: {
                    mapValue: {
                      fields: {
                        x: { doubleValue: slot.x },
                        y: { doubleValue: slot.y },
                        rot: { doubleValue: slot.rot },
                      },
                    },
                  },
                  shareId: { stringValue: shareId },
                  treeId: { nullValue: null },
                  createdAt: { timestampValue: timestamp },
                },
              },
              currentDocument: { exists: false },
            },
            {
              update: { name: userName, fields: userFields },
              updateMask: { fieldPaths: userFieldPaths },
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new WishError("service-error", "Could not create wish.");
    }

    committed = true;
    return { wishId, shareId, createdAt: timestamp, slot };
  } finally {
    if (!committed) {
      await authorizedFirestoreFetch(`${databaseName}/documents:rollback`, {
        method: "POST",
        body: JSON.stringify({ transaction }),
      }).catch(() => undefined);
    }
  }
}

export async function listRecentWishes(
  viewerId: string | null,
): Promise<WishView[]> {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const response = await authorizedFirestoreFetch(
    `${databaseName}/documents:runQuery`,
    {
      method: "POST",
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "wishes" }],
          orderBy: [
            { field: { fieldPath: "createdAt" }, direction: "DESCENDING" },
          ],
          limit: RECENT_LIMIT,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new WishError("service-error", "Could not list wishes.");
  }

  const rows = (await response.json()) as Array<{
    document?: FirestoreDocument;
  }>;

  return rows
    .map((row) =>
      row.document ? wishFromDocument(row.document, viewerId) : null,
    )
    .filter((wish): wish is WishView => wish !== null);
}

export async function getWishTreeStats(): Promise<WishTreeStatsView> {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const response = await authorizedFirestoreFetch(
    `${databaseName}/documents/stats/wishtree`,
  );

  if (response.status === 404) {
    return { totalHung: 0, totalFulfilled: 0, pileCount: 0 };
  }
  if (!response.ok) {
    throw new WishError("service-error", "Could not read wish tree stats.");
  }

  const document = (await response.json()) as FirestoreDocument;
  const fields = document.fields ?? {};
  return {
    totalHung: numberField(fields, "totalHung"),
    totalFulfilled: numberField(fields, "totalFulfilled"),
    pileCount: numberField(fields, "pileCount"),
  };
}

async function readWishInTransaction(
  databaseName: string,
  wishId: string,
  transaction: string,
) {
  const response = await authorizedFirestoreFetch(
    `${databaseName}/documents/wishes/${encodeURIComponent(wishId)}?transaction=${encodeURIComponent(transaction)}`,
  );

  if (response.status === 404) {
    throw new WishError("not-found", "Wish not found.");
  }
  if (!response.ok) {
    throw new WishError("service-error", "Could not read wish.");
  }

  return (await response.json()) as FirestoreDocument;
}

export async function reportWish(input: {
  wishId: string;
  reporterId: string;
}) {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const transaction = await beginTransaction(databaseName);
  let committed = false;

  try {
    const wish = await readWishInTransaction(
      databaseName,
      input.wishId,
      transaction,
    );
    const reportName = `${databaseName}/documents/wishes/${input.wishId}/reports/${input.reporterId}`;
    const reportResponse = await authorizedFirestoreFetch(
      `${reportName}?transaction=${encodeURIComponent(transaction)}`,
    );

    if (reportResponse.ok) {
      throw new WishError("duplicate-report", "Wish already reported.");
    }
    if (reportResponse.status !== 404) {
      throw new WishError("service-error", "Could not read report.");
    }

    const reportCount = numberField(wish.fields ?? {}, "reportCount") + 1;
    const hidden = reportCount >= REPORT_THRESHOLD;
    const timestamp = new Date().toISOString();
    const response = await authorizedFirestoreFetch(
      `${databaseName}/documents:commit`,
      {
        method: "POST",
        body: JSON.stringify({
          transaction,
          writes: [
            {
              update: {
                name: reportName,
                fields: { createdAt: { timestampValue: timestamp } },
              },
              currentDocument: { exists: false },
            },
            {
              update: {
                name: `${databaseName}/documents/wishes/${input.wishId}`,
                fields: {
                  reportCount: { integerValue: String(reportCount) },
                  hidden: { booleanValue: hidden },
                },
              },
              updateMask: { fieldPaths: ["reportCount", "hidden"] },
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      throw new WishError("service-error", "Could not report wish.");
    }

    committed = true;
    return { reportCount, hidden };
  } finally {
    if (!committed) await rollbackTransaction(databaseName, transaction);
  }
}

export async function takeDownWish(input: { wishId: string; ownerId: string }) {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const transaction = await beginTransaction(databaseName);
  let committed = false;

  try {
    const wish = await readWishInTransaction(
      databaseName,
      input.wishId,
      transaction,
    );
    if (stringField(wish.fields ?? {}, "ownerId") !== input.ownerId) {
      throw new WishError("forbidden", "Only the owner can take down a wish.");
    }

    const response = await authorizedFirestoreFetch(
      `${databaseName}/documents:commit`,
      {
        method: "POST",
        body: JSON.stringify({
          transaction,
          writes: [
            {
              update: {
                name: `${databaseName}/documents/wishes/${input.wishId}`,
                fields: {
                  takenDownAt: { timestampValue: new Date().toISOString() },
                },
              },
              updateMask: { fieldPaths: ["takenDownAt"] },
            },
          ],
        }),
      },
    );
    if (!response.ok) {
      throw new WishError("service-error", "Could not take down wish.");
    }

    committed = true;
  } finally {
    if (!committed) await rollbackTransaction(databaseName, transaction);
  }
}

export async function updateWishPrivacy(input: {
  wishId: string;
  ownerId: string;
  displayName: string;
  isPublic: boolean;
  anonymous: boolean;
}) {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const transaction = await beginTransaction(databaseName);
  let committed = false;

  try {
    const wish = await readWishInTransaction(
      databaseName,
      input.wishId,
      transaction,
    );
    if (stringField(wish.fields ?? {}, "ownerId") !== input.ownerId) {
      throw new WishError("forbidden", "Only the owner can update a wish.");
    }

    const response = await authorizedFirestoreFetch(
      `${databaseName}/documents:commit`,
      {
        method: "POST",
        body: JSON.stringify({
          transaction,
          writes: [
            {
              update: {
                name: `${databaseName}/documents/wishes/${input.wishId}`,
                fields: {
                  isPublic: { booleanValue: input.isPublic },
                  anonymous: { booleanValue: input.anonymous },
                  displayName: input.anonymous
                    ? { nullValue: null }
                    : { stringValue: input.displayName.slice(0, 60) },
                },
              },
              updateMask: {
                fieldPaths: ["isPublic", "anonymous", "displayName"],
              },
            },
          ],
        }),
      },
    );
    if (!response.ok) {
      throw new WishError("service-error", "Could not update wish.");
    }

    committed = true;
    return {
      isPublic: input.isPublic,
      anonymous: input.anonymous,
      displayName: input.anonymous ? null : input.displayName.slice(0, 60),
    };
  } finally {
    if (!committed) await rollbackTransaction(databaseName, transaction);
  }
}

async function queryOwnedWishDocuments(ownerId: string, limit?: number) {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const response = await authorizedFirestoreFetch(
    `${databaseName}/documents:runQuery`,
    {
      method: "POST",
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "wishes" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "ownerId" },
              op: "EQUAL",
              value: { stringValue: ownerId },
            },
          },
          ...(limit ? { limit } : {}),
        },
      }),
    },
  );

  if (!response.ok) {
    throw new WishError("service-error", "Could not list owned wishes.");
  }

  const rows = (await response.json()) as Array<{
    document?: FirestoreDocument;
  }>;
  return rows.flatMap((row) => (row.document ? [row.document] : []));
}

export async function listMyWishes(ownerId: string): Promise<MyWishView[]> {
  const documents = await queryOwnedWishDocuments(ownerId, 100);
  return documents
    .map(myWishFromDocument)
    .filter((wish): wish is MyWishView => wish !== null)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );
}

export async function updateWishFulfilled(input: {
  wishId: string;
  ownerId: string;
  fulfilled: boolean;
}) {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const transaction = await beginTransaction(databaseName);
  let committed = false;

  try {
    const wish = await readWishInTransaction(
      databaseName,
      input.wishId,
      transaction,
    );
    if (stringField(wish.fields ?? {}, "ownerId") !== input.ownerId) {
      throw new WishError("forbidden", "Only the owner can update a wish.");
    }

    const response = await authorizedFirestoreFetch(
      `${databaseName}/documents:commit`,
      {
        method: "POST",
        body: JSON.stringify({
          transaction,
          writes: [
            {
              update: {
                name: `${databaseName}/documents/wishes/${input.wishId}`,
                fields: {
                  fulfilled: { booleanValue: input.fulfilled },
                  fulfilledAt: input.fulfilled
                    ? { timestampValue: new Date().toISOString() }
                    : { nullValue: null },
                },
              },
              updateMask: { fieldPaths: ["fulfilled", "fulfilledAt"] },
            },
          ],
        }),
      },
    );
    if (!response.ok) {
      throw new WishError("service-error", "Could not update wish state.");
    }

    committed = true;
    return { fulfilled: input.fulfilled };
  } finally {
    if (!committed) await rollbackTransaction(databaseName, transaction);
  }
}

export async function updateWishText(input: {
  wishId: string;
  ownerId: string;
  text: string;
}) {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const transaction = await beginTransaction(databaseName);
  let committed = false;

  try {
    const wish = await readWishInTransaction(
      databaseName,
      input.wishId,
      transaction,
    );
    const fields = wish.fields ?? {};
    if (stringField(fields, "ownerId") !== input.ownerId) {
      throw new WishError("forbidden", "Only the owner can update a wish.");
    }
    const editableUntil = fields.editableUntil?.timestampValue;
    if (!editableUntil || new Date(editableUntil).getTime() <= Date.now()) {
      throw new WishError("edit-window-closed", "Wish edit window is closed.");
    }
    const editCount = numberField(fields, "editCount");
    if (editCount >= 3) {
      throw new WishError("edit-limit-reached", "Wish edit limit reached.");
    }

    const text = Array.from(input.text.trim())
      .slice(0, TEXT_LIMIT.paper)
      .join("");
    const response = await authorizedFirestoreFetch(
      `${databaseName}/documents:commit`,
      {
        method: "POST",
        body: JSON.stringify({
          transaction,
          writes: [
            {
              update: {
                name: `${databaseName}/documents/wishes/${input.wishId}`,
                fields: {
                  text: { stringValue: text },
                  editCount: { integerValue: String(editCount + 1) },
                },
              },
              updateMask: { fieldPaths: ["text", "editCount"] },
            },
          ],
        }),
      },
    );
    if (!response.ok) {
      throw new WishError("service-error", "Could not edit wish.");
    }

    committed = true;
    return { text, editCount: editCount + 1 };
  } finally {
    if (!committed) await rollbackTransaction(databaseName, transaction);
  }
}

export async function anonymizeAccountData(ownerId: string) {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const documents = await queryOwnedWishDocuments(ownerId);

  if (documents.length > 490) {
    throw new WishError("service-error", "Too many wishes to anonymize.");
  }

  const writes = documents.flatMap((document) => {
    const wishId = document.fields
      ? stringField(document.fields, "wishId")
      : "";
    if (!wishId) return [];

    return [
      {
        update: {
          name: `${databaseName}/documents/wishes/${wishId}`,
          fields: {
            ownerId: { stringValue: `departed:${crypto.randomUUID()}` },
            displayName: { nullValue: null },
            anonymous: { booleanValue: true },
          },
        },
        updateMask: {
          fieldPaths: ["ownerId", "displayName", "anonymous"],
        },
      },
    ];
  });

  const response = await authorizedFirestoreFetch(
    `${databaseName}/documents:commit`,
    {
      method: "POST",
      body: JSON.stringify({
        writes: [
          ...writes,
          { delete: `${databaseName}/documents/users/${ownerId}` },
        ],
      }),
    },
  );
  if (!response.ok) {
    throw new WishError("service-error", "Could not anonymize account data.");
  }
}
