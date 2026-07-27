import { getFirebaseServiceAccount } from "@/lib/firebase/credentials";

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const FIREBASE_AUTH_SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/firebase.database",
  "https://www.googleapis.com/auth/firebase.messaging",
  "https://www.googleapis.com/auth/identitytoolkit",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

let accessTokenCache:
  { accessToken: string; refreshAfterEpochSeconds: number } | undefined;

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function encodeJson(value: object) {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

function decodePem(privateKey: string) {
  const base64 = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

async function createServiceAccountAssertion() {
  const { clientEmail, privateKey } = getFirebaseServiceAccount();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const encodedHeader = encodeJson({ alg: "RS256", typ: "JWT" });
  const encodedPayload = encodeJson({
    iss: clientEmail,
    scope: FIREBASE_AUTH_SCOPES,
    aud: GOOGLE_OAUTH_TOKEN_URL,
    iat: nowSeconds,
    exp: nowSeconds + 60 * 60,
  });
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signingKey = await crypto.subtle.importKey(
    "pkcs8",
    decodePem(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    signingKey,
    new TextEncoder().encode(unsignedToken),
  );

  return `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function getGoogleAccessToken() {
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (
    accessTokenCache &&
    accessTokenCache.refreshAfterEpochSeconds > nowSeconds
  ) {
    return accessTokenCache.accessToken;
  }

  const assertion = await createServiceAccountAssertion();
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const result: unknown = await response.json();
  const accessToken =
    typeof result === "object" && result && "access_token" in result
      ? String(result.access_token)
      : undefined;
  const expiresIn =
    typeof result === "object" && result && "expires_in" in result
      ? Number(result.expires_in)
      : 0;

  if (!response.ok || !accessToken || !Number.isFinite(expiresIn)) {
    throw new Error(`Google OAuth token exchange failed (${response.status}).`);
  }

  accessTokenCache = {
    accessToken,
    refreshAfterEpochSeconds: nowSeconds + Math.max(60, expiresIn - 5 * 60),
  };

  return accessToken;
}

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
