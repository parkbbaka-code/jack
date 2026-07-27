import { getFirebaseServiceAccount } from "@/lib/firebase/credentials";
import { getGoogleAccessToken } from "@/lib/firebase/google-access-token";

export async function createFirebaseSessionCookie(
  idToken: string,
  expiresInSeconds: number,
) {
  const { projectId } = getFirebaseServiceAccount();
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}:createSessionCookie`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
        validDuration: expiresInSeconds,
      }),
    },
  );
  const result: unknown = await response.json();
  const sessionCookie =
    typeof result === "object" && result && "sessionCookie" in result
      ? String(result.sessionCookie)
      : undefined;

  if (!response.ok || !sessionCookie) {
    throw new Error(
      `Firebase session cookie creation failed (${response.status}).`,
    );
  }

  return sessionCookie;
}
