import { getFirebaseServiceAccount } from "@/lib/firebase/credentials";
import { getGoogleAccessToken } from "@/lib/firebase/google-access-token";
import {
  EDIT_WINDOW_MIN,
  PAPER_TTL_DAYS,
  TEXT_LIMIT,
} from "@/constants/wishes";
import { assignWishSlot } from "@/lib/wishes/slots";
import { nanoid } from "nanoid";

export class WishError extends Error {
  constructor(
    public readonly reason:
      "free-paper-used" | "not-found" | "forbidden" | "service-error",
    message: string,
  ) {
    super(message);
  }
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
