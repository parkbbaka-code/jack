import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export async function verifySession(sessionCookie: string) {
  try {
    return await getFirebaseAdminAuth().verifySessionCookie(sessionCookie);
  } catch {
    return null;
  }
}
