import { getFirebaseServiceAccount } from "@/lib/firebase/credentials";
import { getGoogleAccessToken } from "@/lib/firebase/google-access-token";

export async function deleteFirebaseAccount(uid: string) {
  const { projectId } = getFirebaseServiceAccount();
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:delete",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        localId: uid,
        targetProjectId: projectId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Firebase account deletion failed (${response.status}).`);
  }
}
