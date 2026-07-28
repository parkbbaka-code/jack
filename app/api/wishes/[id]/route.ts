import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  getApiSession,
  getSessionDisplayName,
  isSameOrigin,
} from "@/lib/auth/api-session";
import { updateWishPrivacy, WishError } from "@/lib/firebase/firestore-rest";

const bodySchema = z.object({
  isPublic: z.boolean(),
  anonymous: z.boolean(),
});

export async function PATCH(
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

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const privacy = await updateWishPrivacy({
      wishId: id,
      ownerId: session.uid,
      displayName: getSessionDisplayName(session),
      ...parsed.data,
    });
    return NextResponse.json(privacy);
  } catch (error) {
    if (error instanceof WishError) {
      const status = error.reason === "not-found" ? 404 : 403;
      if (error.reason === "not-found" || error.reason === "forbidden") {
        return NextResponse.json({ error: error.reason }, { status });
      }
    }
    console.error("Wish privacy update failed", {
      reason: error instanceof WishError ? error.reason : "unknown",
    });
    return NextResponse.json({ error: "service-error" }, { status: 503 });
  }
}
