import { getFirebaseServiceAccount } from "@/lib/firebase/credentials";
import { getGoogleAccessToken } from "@/lib/firebase/google-access-token";

export class WishError extends Error {
  constructor(
    public readonly reason: "not-found" | "forbidden" | "service-error",
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
