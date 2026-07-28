import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { HungWishArrival } from "@/features/wishes/components/hung-wish-arrival";
import { TreeTrunkPanel } from "@/features/wishes/components/tree-trunk-panel";
import { WishTreeExperience } from "@/features/wishes/components/wish-tree-experience";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import {
  getWishTreeStats,
  listRecentWishes,
} from "@/lib/firebase/firestore-rest";
import { verifySession } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function WishTreePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;
  const [wishes, stats] = await Promise.all([
    listRecentWishes(session?.uid ?? null).catch((error) => {
      console.error("Recent wishes could not be loaded", error);
      return [];
    }),
    getWishTreeStats().catch((error) => {
      console.error("Wish tree stats could not be loaded", error);
      return {
        totalHung: 0,
        totalFulfilled: 0,
        pileCount: 0,
      };
    }),
  ]);
  const focusX = Number(params.x);
  const focusY = Number(params.y);
  const focus =
    typeof params.wish === "string" &&
    Number.isFinite(focusX) &&
    Number.isFinite(focusY) &&
    focusX >= 0 &&
    focusX <= 100 &&
    focusY >= 0 &&
    focusY <= 100
      ? {
          wishId: params.wish,
          x: focusX,
          y: focusY,
          fulfilled: params.fulfilled === "1",
        }
      : null;

  return (
    <main className="wish-night min-h-svh text-[#F6F2E9]">
      <Suspense fallback={null}>
        <HungWishArrival />
      </Suspense>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-[#0B1A3A]/80 px-5 py-6 backdrop-blur-sm sm:px-8">
        <Link className="font-serif text-xl tracking-[0.18em]" href="/">
          이루리
        </Link>
        <Link className="text-base text-[#E8EDF7]" href="/mywishes">
          내 소원
        </Link>
      </header>

      <WishTreeExperience
        currentUserId={session?.uid ?? null}
        focus={focus}
        initialWishes={wishes}
        totalFulfilled={Math.max(
          stats.totalFulfilled,
          wishes.filter((wish) => wish.fulfilled).length,
        )}
      />

      <TreeTrunkPanel />
    </main>
  );
}
