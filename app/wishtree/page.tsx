import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { HungWishArrival } from "@/features/wishes/components/hung-wish-arrival";
import { WishTreeExperience } from "@/features/wishes/components/wish-tree-experience";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import {
  getWishTreeStats,
  listRecentWishes,
} from "@/lib/firebase/firestore-rest";
import { verifySession } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function WishTreePage() {
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

  return (
    <main className="wish-night min-h-svh text-[#F6F2E9]">
      <Suspense fallback={null}>
        <HungWishArrival />
      </Suspense>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-[#0B1A3A]/80 px-5 py-6 backdrop-blur-sm sm:px-8">
        <Link className="font-serif text-xl tracking-[0.18em]" href="/">
          IROORI
        </Link>
        <Link className="text-base text-[#E8EDF7]" href="/mywishes">
          내 소원
        </Link>
      </header>

      <section className="tree-scroll-panel tree-canopy-panel">
        <div className="tree-panel-copy">
          <p className="wish-eyebrow">소원나무</p>
          <p className="mt-3 text-base text-[#E8EDF7]">
            별빛 아래, 이루어진 소원들이 머무는 곳
          </p>
          {stats.totalFulfilled > 0 ? (
            <p className="mt-4 inline-flex rounded-full bg-[#0C1810]/60 px-4 py-2 text-xs text-[#F6F2E9]">
              이 나무에서 {stats.totalFulfilled.toLocaleString("ko-KR")}개의
              소원이 이루어졌어요
            </p>
          ) : null}
        </div>
      </section>

      <WishTreeExperience
        currentUserId={session?.uid ?? null}
        initialWishes={wishes}
      />

      <section className="tree-scroll-panel tree-trunk-panel">
        <div className="tree-panel-copy self-end">
          <p className="wish-eyebrow">나무의 밑동</p>
          <p className="mt-3 max-w-56 text-sm leading-6 text-[#E8EDF7]">
            잎 사이 별빛이 비추는 밤, 소원은 이곳에 오래 머뭅니다.
          </p>
        </div>
        <div className="relative z-10 flex items-end justify-end">
          <Link className="wish-gold-button shrink-0" href="/wish/new">
            소원 걸기
          </Link>
        </div>
      </section>
    </main>
  );
}
