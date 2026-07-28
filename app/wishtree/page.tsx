import Link from "next/link";
import { Suspense } from "react";

import { HungWishArrival } from "@/features/wishes/components/hung-wish-arrival";

export default function WishTreePage() {
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
        </div>
      </section>

      <section className="tree-scroll-panel tree-branch-panel">
        <div className="tree-panel-copy">
          <p className="wish-eyebrow">가지에 걸린 소원</p>
          <p className="mt-3 text-base text-[#E8EDF7]">
            이 나무에는 소원들이 조용히 흔들리고 있어요
          </p>
        </div>
        <div className="tree-wish-grid" aria-label="가지에 걸린 소원지">
          {Array.from({ length: 4 }, (_, index) => (
            <span
              aria-hidden
              className={`tree-wish-object tree-wish-paper-${index}`}
              key={index}
            />
          ))}
        </div>
      </section>

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
