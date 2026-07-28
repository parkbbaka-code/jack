import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { verifySession } from "@/lib/firebase/session";

export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function getApiSession(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return sessionCookie ? verifySession(sessionCookie) : null;
}

export function getSessionDisplayName(session: unknown) {
  const claims = session as { displayName?: unknown; name?: unknown };
  return typeof claims.displayName === "string"
    ? claims.displayName
    : typeof claims.name === "string"
      ? claims.name
      : "이루리 사용자";
}
