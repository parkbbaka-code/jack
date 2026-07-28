import { getFirebaseServiceAccount } from "@/lib/firebase/credentials";
import { signServiceAccountJwt } from "@/lib/firebase/google-access-token";

const FIREBASE_CUSTOM_TOKEN_AUDIENCE =
  "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";

export async function createFirebaseCustomToken(
  uid: string,
  claims: Record<string, unknown> = {},
) {
  const { clientEmail } = getFirebaseServiceAccount();
  const nowSeconds = Math.floor(Date.now() / 1000);

  return signServiceAccountJwt({
    iss: clientEmail,
    sub: clientEmail,
    aud: FIREBASE_CUSTOM_TOKEN_AUDIENCE,
    iat: nowSeconds,
    exp: nowSeconds + 60 * 60,
    uid,
    claims,
  });
}
