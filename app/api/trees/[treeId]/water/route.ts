import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import {
  WateringError,
  waterTreeWithJournal,
} from "@/lib/firebase/firestore-rest";
import { verifySession } from "@/lib/firebase/session";

const bodySchema = z.object({
  text: z.string().trim().min(1).max(500),
  mood: z.enum(["calm", "grateful", "hopeful", "tired"]),
});
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

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid journal" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid journal" }, { status: 400 });
  }

  const parsedTreeId = treeIdSchema.safeParse((await params).treeId);

  if (!parsedTreeId.success) {
    return NextResponse.json({ error: "Invalid tree" }, { status: 400 });
  }

  try {
    const result = await waterTreeWithJournal({
      ownerId: session.uid,
      treeId: parsedTreeId.data,
      text: parsed.data.text,
      mood: parsed.data.mood,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof WateringError) {
      const statuses: Record<WateringError["reason"], number> = {
        "not-found": 404,
        forbidden: 403,
        "already-watered": 409,
        "not-growing": 409,
        "service-error": 503,
      };

      console.error("Watering transaction failed", {
        reason: error.reason,
        message: error.message,
      });

      return NextResponse.json(
        { error: error.reason },
        { status: statuses[error.reason] },
      );
    }

    console.error("Unexpected watering error", {
      message: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json({ error: "service-error" }, { status: 503 });
  }
}
