import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { createPublicWish, WishError } from "@/lib/firebase/firestore-rest";
import { verifySession } from "@/lib/firebase/session";

const bodySchema = z.object({
  text: z.string().trim().min(2).max(5_000),
  anonymous: z.boolean(),
  isPublic: z.boolean(),
});

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

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid wish" }, { status: 400 });
  }

  try {
    const wish = await createPublicWish({
      ownerId: session.uid,
      displayName:
        typeof session.displayName === "string"
          ? session.displayName
          : typeof session.name === "string"
            ? session.name
            : "이루리 사용자",
      email: typeof session.email === "string" ? session.email : null,
      photoURL: typeof session.picture === "string" ? session.picture : null,
      provider:
        session.authProvider === "kakao" ||
        session.firebase?.sign_in_provider === "custom"
          ? "kakao"
          : "google",
      ...parsed.data,
    });

    return NextResponse.json(wish, { status: 201 });
  } catch (error) {
    if (error instanceof WishError && error.reason === "free-paper-used") {
      return NextResponse.json({ error: error.reason }, { status: 409 });
    }
    console.error("Wish creation failed", {
      reason: error instanceof WishError ? error.reason : "unknown",
    });
    return NextResponse.json({ error: "service-error" }, { status: 503 });
  }
}
