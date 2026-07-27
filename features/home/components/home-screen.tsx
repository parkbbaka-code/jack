"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { WaterJournalForm } from "@/features/journal/components/water-journal-form";
import { BloomCard } from "@/features/tree/components/bloom-card";
import { TreeRenderer } from "@/features/tree/components/tree-renderer";
import type { Journal, Tree, Wish } from "@/types/models";

type HomeData = { tree: Tree; wish: Wish | null; journals: Journal[] };

const seasonNames: Record<Tree["season"], string> = {
  spring: "봄",
  summer: "여름",
  autumn: "가을",
  winter: "겨울",
};

export function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

        const profileSnapshot = await firestore.getDocFromServer(
          firestore.doc(db, "users", user.uid),
        );
        const activeTreeId = profileSnapshot.data()?.activeTreeId;

        if (!activeTreeId) {
          router.replace("/onboarding");
          return;
        }

        const treeSnapshot = await firestore.getDocFromServer(
          firestore.doc(db, "trees", String(activeTreeId)),
        );

        if (!treeSnapshot.exists()) {
          router.replace("/onboarding");
          return;
        }

        const tree = treeSnapshot.data() as Tree;
        const wishSnapshot = await firestore.getDocFromServer(
          firestore.doc(db, "wishes", tree.wishId),
        );

        if (!cancelled) {
          const journalsQuery = firestore.query(
            firestore.collection(db, "trees", tree.treeId, "journals"),
            firestore.orderBy("createdAt", "desc"),
            firestore.limit(7),
          );
          const journalsSnapshot =
            await firestore.getDocsFromServer(journalsQuery);

          setData({
            tree,
            wish: wishSnapshot.exists() ? (wishSnapshot.data() as Wish) : null,
            journals: journalsSnapshot.docs.map(
              (journal) => journal.data() as Journal,
            ),
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
  }, [refreshKey, router]);

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

      <section className="border-forest/10 relative mt-8 flex min-h-80 flex-col items-center justify-center rounded-[2.5rem] border bg-white/45 px-5 py-8 text-center shadow-sm backdrop-blur-md sm:px-8">
        <TreeRenderer
          cheerCount={data.tree.growth.cheerCount}
          season={data.tree.season}
          seed={data.tree.seed}
          status={data.tree.status}
          waterCount={data.tree.growth.waterCount}
        />
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

      <BloomCard
        onBloomed={() => {
          setData(null);
          setRefreshKey((value) => value + 1);
        }}
        tree={data.tree}
      />

      <WaterJournalForm
        isGrowing={data.tree.status === "growing"}
        journals={data.journals}
        onWatered={() => {
          setData(null);
          setRefreshKey((value) => value + 1);
        }}
        treeId={data.tree.treeId}
      />
    </main>
  );
}
