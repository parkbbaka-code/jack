"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { TreeRenderer } from "@/features/tree/components/tree-renderer";
import { getAwayDays, getReturnMessage } from "@/features/tree/lib/return";
import type { Tree } from "@/types/models";

export function WelcomeBackScreen() {
  const router = useRouter();
  const [tree, setTree] = useState<Tree | null>(null);
  const [awayDays, setAwayDays] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const [{ getFirebaseClientServices }, firebaseAuth, firestore] =
        await Promise.all([
          import("@/lib/firebase/client"),
          import("firebase/auth"),
          import("firebase/firestore"),
        ]);
      const { auth, db } = getFirebaseClientServices();

      unsubscribe = firebaseAuth.onAuthStateChanged(auth, async (user) => {
        if (!user || cancelled) {
          if (!user) router.replace("/login?next=%2Fwelcome-back");
          return;
        }

        const profile = await firestore.getDocFromServer(
          firestore.doc(db, "users", user.uid),
        );
        const activeTreeId = profile.data()?.activeTreeId;

        if (!activeTreeId) {
          router.replace("/onboarding");
          return;
        }

        const snapshot = await firestore.getDocFromServer(
          firestore.doc(db, "trees", String(activeTreeId)),
        );

        if (!snapshot.exists()) {
          router.replace("/onboarding");
          return;
        }

        const nextTree = snapshot.data() as Tree;
        const nextAwayDays = getAwayDays(
          nextTree.lastWateredAt?.toDate() ?? null,
        );

        if (nextAwayDays < 3) {
          router.replace("/home");
          return;
        }

        sessionStorage.setItem(`iroori-return-${nextTree.treeId}`, "shown");

        if (!cancelled) {
          setTree(nextTree);
          setAwayDays(nextAwayDays);
        }
      });
    })().catch(() => {
      if (!cancelled) toast.error("나무 정보를 불러오지 못했습니다.");
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [router]);

  if (!tree) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <LoaderCircle className="text-canopy size-6 animate-spin" />
        <span className="sr-only">나무 불러오는 중</span>
      </main>
    );
  }

  return (
    <main className="relative mx-auto flex min-h-svh max-w-xl flex-col justify-center overflow-hidden px-6 py-10 text-center">
      <div aria-hidden className="forest-halo" />
      <section className="border-forest/10 relative rounded-[2.5rem] border bg-white/55 px-6 py-9 shadow-sm backdrop-blur-md">
        <p className="text-canopy text-xs font-semibold tracking-[0.24em]">
          WELCOME BACK
        </p>
        <h1 className="text-forest mt-4 font-serif text-3xl leading-tight sm:text-4xl">
          {getReturnMessage(awayDays)}
        </h1>
        <div className="mx-auto mt-4 max-w-xs">
          <TreeRenderer
            cheerCount={tree.growth.cheerCount}
            season={tree.season}
            seed={tree.seed}
            status={tree.status}
            waterCount={tree.growth.waterCount}
          />
        </div>
        <p className="text-sub mt-2 text-sm leading-6">
          {tree.step ?? "오늘의 작은 한 걸음부터 다시 시작해요."}
        </p>
        <button
          className="button-primary mx-auto mt-7 gap-2"
          onClick={() => router.replace("/home")}
          type="button"
        >
          나무에게 물 주러 가기 <ArrowRight className="size-4" />
        </button>
      </section>
    </main>
  );
}
