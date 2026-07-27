import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { createFirebaseSessionCookie } from "@/lib/firebase/session-cookie";

const bodySchema = z.object({ idToken: z.string().min(1) });

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  try {
    const auth = getFirebaseAdminAuth();
    const decoded = await auth.verifyIdToken(parsed.data.idToken);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (nowSeconds - decoded.auth_time > 5 * 60) {
      return NextResponse.json(
        { error: "Recent sign-in required" },
        { status: 401 },
      );
    }

    const sessionCookie = await createFirebaseSessionCookie(
      parsed.data.idToken,
      SESSION_MAX_AGE_SECONDS,
    );
    const response = NextResponse.json({ ok: true });

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    return response;
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "unknown";
    const message =
      error instanceof Error ? error.message : "Unknown session error";

    console.error("Firebase session creation failed", { code, message });

    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
