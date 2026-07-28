import { NextResponse, type NextRequest } from "next/server";

import { getApiSession, isSameOrigin } from "@/lib/auth/api-session";
import { takeDownWish, WishError } from "@/lib/firebase/firestore-rest";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await getApiSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await takeDownWish({ wishId: id, ownerId: session.uid });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof WishError) {
      const status = error.reason === "not-found" ? 404 : 403;
      if (error.reason === "not-found" || error.reason === "forbidden") {
        return NextResponse.json({ error: error.reason }, { status });
      }
    }
    console.error("Wish takedown failed", {
      reason: error instanceof WishError ? error.reason : "unknown",
    });
    return NextResponse.json({ error: "service-error" }, { status: 503 });
  }
}
