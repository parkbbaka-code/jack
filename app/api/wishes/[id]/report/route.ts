import { NextResponse, type NextRequest } from "next/server";

import { getApiSession, isSameOrigin } from "@/lib/auth/api-session";
import { reportWish, WishError } from "@/lib/firebase/firestore-rest";

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
    return NextResponse.json(
      await reportWish({ wishId: id, reporterId: session.uid }),
    );
  } catch (error) {
    if (error instanceof WishError) {
      if (error.reason === "duplicate-report") {
        return NextResponse.json({ error: error.reason }, { status: 409 });
      }
      if (error.reason === "not-found") {
        return NextResponse.json({ error: error.reason }, { status: 404 });
      }
    }
    console.error("Wish report failed", {
      reason: error instanceof WishError ? error.reason : "unknown",
    });
    return NextResponse.json({ error: "service-error" }, { status: 503 });
  }
}
