import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { BloomError, bloomTree } from "@/lib/firebase/firestore-rest";
import { verifySession } from "@/lib/firebase/session";

const treeIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ treeId: string }> },
) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedTreeId = treeIdSchema.safeParse((await params).treeId);

  if (!parsedTreeId.success) {
    return NextResponse.json({ error: "Invalid tree" }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await bloomTree({ ownerId: session.uid, treeId: parsedTreeId.data }),
    );
  } catch (error) {
    if (error instanceof BloomError) {
      const statuses: Record<BloomError["reason"], number> = {
        "not-found": 404,
        forbidden: 403,
        "not-ready": 409,
        "already-bloomed": 409,
        "service-error": 503,
      };

      console.error("Bloom transaction failed", {
        reason: error.reason,
        message: error.message,
      });

      return NextResponse.json(
        { error: error.reason },
        { status: statuses[error.reason] },
      );
    }

    console.error("Unexpected bloom error", {
      message: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json({ error: "service-error" }, { status: 503 });
  }
}
