import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  getApiSession,
  getSessionDisplayName,
  isSameOrigin,
} from "@/lib/auth/api-session";
import {
  updateWishFulfilled,
  updateWishPrivacy,
  updateWishText,
  WishError,
} from "@/lib/firebase/firestore-rest";

const bodySchema = z.union([
  z.object({ isPublic: z.boolean(), anonymous: z.boolean() }),
  z.object({ fulfilled: z.boolean() }),
  z.object({ text: z.string().trim().min(2).max(5_000) }),
]);

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
    if ("fulfilled" in parsed.data) {
      return NextResponse.json(
        await updateWishFulfilled({
          wishId: id,
          ownerId: session.uid,
          fulfilled: parsed.data.fulfilled,
        }),
      );
    }
    if ("text" in parsed.data) {
      return NextResponse.json(
        await updateWishText({
          wishId: id,
          ownerId: session.uid,
          text: parsed.data.text,
        }),
      );
    }
    return NextResponse.json(
      await updateWishPrivacy({
        wishId: id,
        ownerId: session.uid,
        displayName: getSessionDisplayName(session),
        ...parsed.data,
      }),
    );
  } catch (error) {
    if (error instanceof WishError) {
      const status = error.reason === "not-found" ? 404 : 403;
      if (
        error.reason === "not-found" ||
        error.reason === "forbidden" ||
        error.reason === "edit-window-closed" ||
        error.reason === "edit-limit-reached"
      ) {
        return NextResponse.json({ error: error.reason }, { status });
      }
    }
    console.error("Wish update failed", {
      reason: error instanceof WishError ? error.reason : "unknown",
    });
    return NextResponse.json({ error: "service-error" }, { status: 503 });
  }
}
