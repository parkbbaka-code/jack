import { getKoreanDateId } from "@/features/journal/lib/date";
import { canBloomTree } from "@/features/tree/lib/bloom";
import { calculateGrowth, getGrowthDetails } from "@/features/tree/lib/growth";
import { getFirebaseServiceAccount } from "@/lib/firebase/credentials";
import { getGoogleAccessToken } from "@/lib/firebase/google-access-token";

interface FirestoreValue {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  timestampValue?: string;
  mapValue?: { fields?: Record<string, FirestoreValue> };
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
  updateTime?: string;
}

export class WateringError extends Error {
  constructor(
    public readonly reason:
      | "not-found"
      | "forbidden"
      | "already-watered"
      | "not-growing"
      | "service-error",
    message: string,
  ) {
    super(message);
  }
}

export class BloomError extends Error {
  constructor(
    public readonly reason:
      | "not-found"
      | "forbidden"
      | "not-ready"
      | "already-bloomed"
      | "service-error",
    message: string,
  ) {
    super(message);
  }
}

export class WishError extends Error {
  constructor(
    public readonly reason: "not-found" | "forbidden" | "service-error",
    message: string,
  ) {
    super(message);
  }
}

function getStringField(document: FirestoreDocument, field: string) {
  return document.fields?.[field]?.stringValue;
}

function getGrowthFields(document: FirestoreDocument) {
  return document.fields?.growth?.mapValue?.fields;
}

function getInteger(value: FirestoreValue | undefined) {
  const parsed = Number(value?.integerValue ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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

async function rollbackTransaction(databaseName: string, transaction: string) {
  await authorizedFirestoreFetch(`${databaseName}/documents:rollback`, {
    method: "POST",
    body: JSON.stringify({ transaction }),
  }).catch(() => undefined);
}

export async function waterTreeWithJournal(input: {
  ownerId: string;
  treeId: string;
  text: string;
  mood: string;
}) {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const treeName = `${databaseName}/documents/trees/${input.treeId}`;
  const beginResponse = await authorizedFirestoreFetch(
    `${databaseName}/documents:beginTransaction`,
    { method: "POST", body: JSON.stringify({ options: { readWrite: {} } }) },
  );
  const beginResult: unknown = await beginResponse.json();
  const transaction =
    typeof beginResult === "object" &&
    beginResult &&
    "transaction" in beginResult
      ? String(beginResult.transaction)
      : undefined;

  if (!beginResponse.ok || !transaction) {
    throw new WateringError("service-error", "Could not begin transaction.");
  }

  try {
    const treeResponse = await authorizedFirestoreFetch(
      `${treeName}?transaction=${encodeURIComponent(transaction)}`,
    );

    if (treeResponse.status === 404) {
      throw new WateringError("not-found", "Tree not found.");
    }

    const tree = (await treeResponse.json()) as FirestoreDocument;

    if (!treeResponse.ok || !tree.updateTime) {
      throw new WateringError("service-error", "Could not read tree.");
    }

    if (getStringField(tree, "ownerId") !== input.ownerId) {
      throw new WateringError("forbidden", "Tree owner does not match.");
    }

    if (getStringField(tree, "status") !== "growing") {
      throw new WateringError("not-growing", "Tree is not growing.");
    }

    const growthFields = getGrowthFields(tree);
    const nextGrowth = calculateGrowth(
      getInteger(growthFields?.waterCount) + 1,
    );
    const nextDetails = getGrowthDetails(nextGrowth.waterCount);
    const now = new Date();
    const timestamp = now.toISOString();
    const journalId = getKoreanDateId(now);
    const journalName = `${treeName}/journals/${journalId}`;
    const commitResponse = await authorizedFirestoreFetch(
      `${databaseName}/documents:commit`,
      {
        method: "POST",
        body: JSON.stringify({
          transaction,
          writes: [
            {
              update: {
                name: journalName,
                fields: {
                  journalId: { stringValue: journalId },
                  ownerId: { stringValue: input.ownerId },
                  treeId: { stringValue: input.treeId },
                  text: { stringValue: input.text },
                  mood: { stringValue: input.mood },
                  waterCountAfter: {
                    integerValue: String(nextGrowth.waterCount),
                  },
                  createdAt: { timestampValue: timestamp },
                },
              },
              currentDocument: { exists: false },
            },
            {
              update: {
                name: treeName,
                fields: {
                  growth: {
                    mapValue: {
                      fields: {
                        waterCount: {
                          integerValue: String(nextGrowth.waterCount),
                        },
                        stageValue: { doubleValue: nextGrowth.stageValue },
                        lastLeafCount: {
                          integerValue: String(nextDetails.leaves),
                        },
                      },
                    },
                  },
                  lastWateredAt: { timestampValue: timestamp },
                  updatedAt: { timestampValue: timestamp },
                },
              },
              updateMask: {
                fieldPaths: [
                  "growth.waterCount",
                  "growth.stageValue",
                  "growth.lastLeafCount",
                  "lastWateredAt",
                  "updatedAt",
                ],
              },
              currentDocument: { updateTime: tree.updateTime },
            },
          ],
        }),
      },
    );

    if (commitResponse.status === 409) {
      throw new WateringError(
        "already-watered",
        "A journal already exists for today.",
      );
    }

    if (!commitResponse.ok) {
      const errorResult: unknown = await commitResponse.json();
      const status =
        typeof errorResult === "object" &&
        errorResult &&
        "error" in errorResult &&
        typeof errorResult.error === "object" &&
        errorResult.error &&
        "status" in errorResult.error
          ? String(errorResult.error.status)
          : "unknown";

      if (status === "ALREADY_EXISTS" || status === "FAILED_PRECONDITION") {
        throw new WateringError(
          "already-watered",
          "A journal already exists for today.",
        );
      }

      throw new WateringError(
        "service-error",
        `Firestore commit failed (${commitResponse.status}, ${status}).`,
      );
    }

    return { journalId, growth: nextGrowth };
  } catch (error) {
    await rollbackTransaction(databaseName, transaction);
    throw error;
  }
}

export async function bloomTree(input: { ownerId: string; treeId: string }) {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const treeName = `${databaseName}/documents/trees/${input.treeId}`;
  const beginResponse = await authorizedFirestoreFetch(
    `${databaseName}/documents:beginTransaction`,
    { method: "POST", body: JSON.stringify({ options: { readWrite: {} } }) },
  );
  const beginResult: unknown = await beginResponse.json();
  const transaction =
    typeof beginResult === "object" &&
    beginResult &&
    "transaction" in beginResult
      ? String(beginResult.transaction)
      : undefined;

  if (!beginResponse.ok || !transaction) {
    throw new BloomError("service-error", "Could not begin transaction.");
  }

  try {
    const treeResponse = await authorizedFirestoreFetch(
      `${treeName}?transaction=${encodeURIComponent(transaction)}`,
    );

    if (treeResponse.status === 404) {
      throw new BloomError("not-found", "Tree not found.");
    }

    const tree = (await treeResponse.json()) as FirestoreDocument;

    if (!treeResponse.ok || !tree.updateTime) {
      throw new BloomError("service-error", "Could not read tree.");
    }

    if (getStringField(tree, "ownerId") !== input.ownerId) {
      throw new BloomError("forbidden", "Tree owner does not match.");
    }

    const status = getStringField(tree, "status");

    if (status === "bloomed" || status === "archived") {
      throw new BloomError("already-bloomed", "Tree already bloomed.");
    }

    const waterCount = getInteger(getGrowthFields(tree)?.waterCount);

    if (status !== "growing" || !canBloomTree("growing", waterCount)) {
      throw new BloomError("not-ready", "Tree is not ready to bloom.");
    }

    const timestamp = new Date().toISOString();
    const commitResponse = await authorizedFirestoreFetch(
      `${databaseName}/documents:commit`,
      {
        method: "POST",
        body: JSON.stringify({
          transaction,
          writes: [
            {
              update: {
                name: treeName,
                fields: {
                  status: { stringValue: "bloomed" },
                  growth: {
                    mapValue: {
                      fields: { bloomedAt: { timestampValue: timestamp } },
                    },
                  },
                  updatedAt: { timestampValue: timestamp },
                },
              },
              updateMask: {
                fieldPaths: ["status", "growth.bloomedAt", "updatedAt"],
              },
              currentDocument: { updateTime: tree.updateTime },
            },
          ],
        }),
      },
    );

    if (!commitResponse.ok) {
      throw new BloomError(
        "service-error",
        `Firestore bloom commit failed (${commitResponse.status}).`,
      );
    }

    return { bloomedAt: timestamp, status: "bloomed" as const };
  } catch (error) {
    await rollbackTransaction(databaseName, transaction);
    throw error;
  }
}

export async function createPublicWish(input: {
  ownerId: string;
  text: string;
  anonymous: boolean;
}) {
  const { projectId } = getFirebaseServiceAccount();
  const databaseName = `projects/${projectId}/databases/(default)`;
  const wishId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const response = await authorizedFirestoreFetch(
    `${databaseName}/documents/wishes?documentId=${wishId}`,
    {
      method: "POST",
      body: JSON.stringify({
        fields: {
          wishId: { stringValue: wishId },
          ownerId: { stringValue: input.ownerId },
          text: { stringValue: input.text },
          status: { stringValue: "active" },
          scope: { stringValue: "public" },
          anonymous: { booleanValue: input.anonymous },
          offering: { stringValue: "paper" },
          createdAt: { timestampValue: timestamp },
          updatedAt: { timestampValue: timestamp },
        },
      }),
    },
  );

  if (!response.ok) {
    throw new WishError("service-error", "Could not create wish.");
  }

  return { wishId, createdAt: timestamp };
}
