export function normalizeFirebasePrivateKey(value: string) {
  return value.replace(/\\+n/g, "\n");
}

export function getFirebaseServiceAccount() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyValue = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyValue) {
    throw new Error("Firebase Admin environment variables are not configured.");
  }

  return {
    projectId,
    clientEmail,
    privateKey: normalizeFirebasePrivateKey(privateKeyValue),
  };
}
