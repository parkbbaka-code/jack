import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export async function verifySession(sessionCookie: string) {
  try {
    return await getFirebaseAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    );
  } catch {
    return null;
  }
}
