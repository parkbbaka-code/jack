import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MyWishes } from "@/features/wishes/components/my-wishes";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { listMyWishes } from "@/lib/firebase/firestore-rest";
import { verifySession } from "@/lib/firebase/session";

export const metadata: Metadata = { title: "내 소원" };

export default async function MyWishesPage() {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;
  if (!session) redirect("/login?next=/mywishes");

  const wishes = await listMyWishes(session.uid).catch((error) => {
    console.error("My wishes could not be loaded", error);
    return [];
  });

  return <MyWishes initialWishes={wishes} />;
}
