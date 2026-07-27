"use client";

import { type FormEvent, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { Leaf, LoaderCircle, LockKeyhole, Trees } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { Season, Visibility } from "@/types/models";

function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;

  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

function createSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

export function OnboardingForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [wish, setWish] = useState("");
  const [step, setStep] = useState("");
  const [treeName, setTreeName] = useState("나의 나무");
  const [scope, setScope] = useState<Visibility>("private");
  const [anonymous, setAnonymous] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      unsubscribe = firebaseAuth.onAuthStateChanged(
        auth,
        async (currentUser) => {
          if (cancelled) return;

          if (!currentUser) {
            router.replace("/login?next=%2Fonboarding");
            return;
          }

          const profileSnapshot = await firestore.getDoc(
            firestore.doc(db, "users", currentUser.uid),
          );

          if (profileSnapshot.data()?.activeTreeId) {
            router.replace("/home");
            return;
          }

          setUser(currentUser);
          setIsLoading(false);
        },
      );
    })().catch(() => {
      if (!cancelled) {
        toast.error("온보딩 정보를 불러오지 못했습니다.");
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !user ||
      wish.trim().length < 2 ||
      step.trim().length < 2 ||
      treeName.trim().length < 1
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const [{ getFirebaseClientServices }, firestore] = await Promise.all([
        import("@/lib/firebase/client"),
        import("firebase/firestore"),
      ]);
      const { db } = getFirebaseClientServices();
      const userRef = firestore.doc(db, "users", user.uid);
      const wishRef = firestore.doc(firestore.collection(db, "wishes"));
      const treeRef = firestore.doc(firestore.collection(db, "trees"));

      await firestore.runTransaction(db, async (transaction) => {
        const profileSnapshot = await transaction.get(userRef);

        if (profileSnapshot.data()?.activeTreeId) {
          throw new Error("onboarding-already-complete");
        }

        const now = firestore.serverTimestamp();

        transaction.set(
          userRef,
          {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            activeTreeId: treeRef.id,
            onboardingCompleted: true,
            ...(profileSnapshot.exists() ? {} : { createdAt: now }),
            updatedAt: now,
          },
          { merge: true },
        );
        transaction.set(wishRef, {
          wishId: wishRef.id,
          ownerId: user.uid,
          treeId: treeRef.id,
          text: wish.trim(),
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
        transaction.set(treeRef, {
          treeId: treeRef.id,
          ownerId: user.uid,
          wishId: wishRef.id,
          name: treeName.trim(),
          wish: wish.trim(),
          step: step.trim(),
          scope,
          anonymous: scope === "private" ? false : anonymous,
          status: "growing",
          season: getCurrentSeason(),
          growth: {
            waterCount: 0,
            cheerCount: 0,
            stageValue: 0,
            bloomedAt: null,
            lastLeafCount: 0,
          },
          seed: createSeed(),
          createdAt: now,
          updatedAt: now,
          lastWateredAt: null,
          returnShownAt: null,
          fruitId: null,
        });
      });

      toast.success("첫 씨앗을 심었습니다.");
      router.replace("/home");
      router.refresh();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "onboarding-already-complete"
      ) {
        router.replace("/home");
        return;
      }

      toast.error("씨앗을 심지 못했습니다. 잠시 후 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <LoaderCircle className="text-canopy size-6 animate-spin" />
        <span className="sr-only">온보딩 불러오는 중</span>
      </main>
    );
  }

  return (
    <main className="relative min-h-svh overflow-hidden px-6 py-10">
      <div aria-hidden className="forest-halo" />
      <form
        className="border-forest/10 relative mx-auto w-full max-w-lg rounded-[2rem] border bg-white/60 p-7 shadow-sm backdrop-blur-md sm:p-10"
        onSubmit={handleSubmit}
      >
        <p className="text-canopy text-xs tracking-[0.24em]">FIRST SEED</p>
        <h1 className="text-forest mt-4 font-serif text-3xl sm:text-4xl">
          어떤 마음을 키워볼까요?
        </h1>
        <p className="text-sub mt-3 leading-7">
          거창하지 않아도 괜찮아요. 지금 마음에 머무는 소원을 적어주세요.
        </p>

        <label className="mt-8 block">
          <span className="text-forest text-sm font-semibold">나의 소원</span>
          <textarea
            className="border-forest/15 text-forest placeholder:text-sub/45 focus:border-canopy mt-2 min-h-32 w-full resize-none rounded-3xl border bg-white/70 px-5 py-4 leading-7 outline-none"
            disabled={isSubmitting}
            maxLength={120}
            minLength={2}
            onChange={(event) => setWish(event.target.value)}
            placeholder="예: 매일 조금씩 나를 위한 글을 쓰고 싶어요."
            required
            value={wish}
          />
          <span className="text-sub mt-1 block text-right text-xs">
            {wish.length}/120
          </span>
        </label>

        <label className="mt-5 block">
          <span className="text-forest text-sm font-semibold">
            오늘의 한 걸음
          </span>
          <p className="text-sub mt-1 text-sm">
            결과가 아니라, 오늘 내가 할 수 있는 작은 행동을 적어주세요.
          </p>
          <input
            className="border-forest/15 text-forest focus:border-canopy mt-2 min-h-12 w-full rounded-2xl border bg-white/70 px-4 outline-none"
            disabled={isSubmitting}
            maxLength={120}
            minLength={2}
            onChange={(event) => setStep(event.target.value)}
            placeholder="예: 이력서 한 줄 고치기"
            required
            value={step}
          />
          <span className="text-sub mt-1 block text-right text-xs">
            {step.length}/120
          </span>
        </label>

        <label className="mt-5 block">
          <span className="text-forest text-sm font-semibold">나무 이름</span>
          <input
            className="border-forest/15 text-forest focus:border-canopy mt-2 min-h-12 w-full rounded-2xl border bg-white/70 px-4 outline-none"
            disabled={isSubmitting}
            maxLength={24}
            onChange={(event) => setTreeName(event.target.value)}
            required
            value={treeName}
          />
        </label>

        <fieldset className="mt-6">
          <legend className="text-forest text-sm font-semibold">
            공개 범위
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="has-checked:border-canopy has-checked:bg-canopy/5 border-forest/12 flex cursor-pointer items-center gap-3 rounded-2xl border bg-white/50 p-4">
              <input
                checked={scope === "private"}
                className="accent-canopy"
                disabled={isSubmitting}
                name="scope"
                onChange={() => setScope("private")}
                type="radio"
              />
              <LockKeyhole aria-hidden className="text-canopy size-4" />
              <span className="text-forest text-sm">나만 보기</span>
            </label>
            <label className="has-checked:border-canopy has-checked:bg-canopy/5 border-forest/12 flex cursor-pointer items-center gap-3 rounded-2xl border bg-white/50 p-4">
              <input
                checked={scope === "public"}
                className="accent-canopy"
                disabled={isSubmitting}
                name="scope"
                onChange={() => setScope("public")}
                type="radio"
              />
              <Trees aria-hidden className="text-canopy size-4" />
              <span className="text-forest text-sm">모두의 숲</span>
            </label>
          </div>
        </fieldset>

        {scope === "public" && (
          <label className="text-sub mt-4 flex items-center gap-3 text-sm">
            <input
              checked={anonymous}
              className="accent-canopy size-4"
              disabled={isSubmitting}
              onChange={(event) => setAnonymous(event.target.checked)}
              type="checkbox"
            />
            모두의 숲에서는 이름을 익명으로 표시해요.
          </label>
        )}

        <button
          className="button-primary mt-8 w-full gap-2 disabled:cursor-wait disabled:opacity-60"
          disabled={isSubmitting || !user}
          type="submit"
        >
          {isSubmitting ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <Leaf aria-hidden className="size-4" />
          )}
          첫 씨앗 심기
        </button>
      </form>
    </main>
  );
}
