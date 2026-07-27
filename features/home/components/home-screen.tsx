"use client";

import { useEffect, useState } from "react";
import { Leaf, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Tree, Wish } from "@/types/models";

type HomeData = { tree: Tree; wish: Wish | null };

const seasonNames: Record<Tree["season"], string> = {
  spring: "봄",
  summer: "여름",
  autumn: "가을",
  winter: "겨울",
};

export function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const [{ getFirebaseClientServices }, firebaseAuth, firestore] =
        await Promise.all([
          import("@/lib/firebase/client"),
          import("firebase/auth"),
          import("firebase/firestore"),
        ]);
      const { auth, db } = getFirebaseClientServices();

      unsubscribe = firebaseAuth.onAuthStateChanged(auth, async (user) => {
        if (cancelled) return;

        if (!user) {
          router.replace("/login?next=%2Fhome");
          return;
        }

        const profileSnapshot = await firestore.getDoc(
          firestore.doc(db, "users", user.uid),
        );
        const activeTreeId = profileSnapshot.data()?.activeTreeId;

        if (!activeTreeId) {
          router.replace("/onboarding");
          return;
        }

        const treeSnapshot = await firestore.getDoc(
          firestore.doc(db, "trees", String(activeTreeId)),
        );

        if (!treeSnapshot.exists()) {
          router.replace("/onboarding");
          return;
        }

        const tree = treeSnapshot.data() as Tree;
        const wishSnapshot = await firestore.getDoc(
          firestore.doc(db, "wishes", tree.wishId),
        );

        if (!cancelled) {
          setData({
            tree,
            wish: wishSnapshot.exists() ? (wishSnapshot.data() as Wish) : null,
          });
        }
      });
    })().catch(() => {
      if (!cancelled) {
        toast.error("나무 정보를 불러오지 못했습니다.");
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [router]);

  if (!data) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <LoaderCircle className="text-canopy size-6 animate-spin" />
        <span className="sr-only">나무 불러오는 중</span>
      </main>
    );
  }

  return (
    <main className="relative mx-auto min-h-svh max-w-2xl overflow-hidden px-6 py-10">
      <div aria-hidden className="forest-halo" />
      <header className="relative flex items-center justify-between">
        <div>
          <p className="text-canopy text-sm">오늘의 나무</p>
          <h1 className="text-forest mt-2 font-serif text-4xl">
            {data.tree.name}
          </h1>
        </div>
        <span className="border-forest/10 text-sub rounded-full border bg-white/55 px-4 py-2 text-xs backdrop-blur">
          {seasonNames[data.tree.season]}의 나무
        </span>
      </header>

      <section className="border-forest/10 relative mt-8 flex min-h-80 flex-col items-center justify-center rounded-[2.5rem] border bg-white/45 px-8 py-12 text-center shadow-sm backdrop-blur-md">
        <div className="bg-canopy/10 flex size-28 items-center justify-center rounded-full">
          <Leaf className="text-canopy size-12" strokeWidth={1.4} />
        </div>
        <p className="text-canopy mt-7 text-xs tracking-[0.22em]">SEED</p>
        <p className="text-forest mt-3 font-serif text-2xl">
          첫 씨앗이 조용히 숨 쉬고 있어요.
        </p>
        <p className="text-sub mt-3 text-sm">
          기록으로 물을 주면 조금씩 자라납니다.
        </p>
      </section>

      {data.wish && (
        <section className="border-gold/25 bg-gold/5 relative mt-6 rounded-3xl border p-6">
          <p className="text-gold text-xs font-semibold tracking-[0.18em]">
            MY WISH
          </p>
          <p className="text-forest mt-3 font-serif text-xl leading-8">
            “{data.wish.text}”
          </p>
        </section>
      )}

      <div className="text-sub relative mt-6 flex justify-between text-sm">
        <span>물 준 날 {data.tree.growth.waterCount}일</span>
        <span>햇살 {data.tree.growth.cheerCount}개</span>
      </div>
    </main>
  );
}
