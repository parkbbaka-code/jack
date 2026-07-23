import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySession } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!session || !(await verifySession(session))) {
    redirect("/login");
  }

  return children;
}
