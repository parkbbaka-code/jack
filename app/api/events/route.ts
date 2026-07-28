import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { isSameOrigin } from "@/lib/auth/api-session";

const eventSchema = z.object({
  name: z.enum([
    "wishtree_viewed",
    "signup_completed",
    "paper_hung",
    "paper_edited",
    "paper_fulfilled",
    "paper_taken_down",
    "paper_opened",
    "mywish_located",
    "share_created",
    "report_submitted",
  ]),
  properties: z
    .record(z.string().max(40), z.union([z.string(), z.number(), z.boolean()]))
    .default({}),
});

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  console.info(
    "IROORI_EVENT",
    JSON.stringify({
      ...parsed.data,
      timestamp: new Date().toISOString(),
    }),
  );
  return new NextResponse(null, { status: 204 });
}
