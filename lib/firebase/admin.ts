import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { getFirebaseServiceAccount } from "@/lib/firebase/credentials";

function getFirebaseAdminApp() {
  const existing = getApps()[0];

  if (existing) return existing;

  const serviceAccount = getFirebaseServiceAccount();

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
