import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SettingsPanel } from "@/features/settings/settings-panel";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getSessionDisplayName } from "@/lib/auth/api-session";
import { verifySession } from "@/lib/firebase/session";

export const metadata: Metadata = { title: "설정" };

export default async function SettingsPage() {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;
  if (!session) redirect("/login?next=/settings");

  const provider =
    session.authProvider === "kakao" ||
    session.firebase?.sign_in_provider === "custom"
      ? "카카오"
      : "구글";

  return (
    <SettingsPanel
      displayName={getSessionDisplayName(session)}
      photoURL={typeof session.picture === "string" ? session.picture : null}
      provider={provider}
    />
  );
}
