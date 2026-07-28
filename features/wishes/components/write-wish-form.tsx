"use client";

import { type FormEvent, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trackEvent } from "@/lib/analytics/client";

type Step = "write" | "confirm";

type CreateWishResponse = {
  slot: { x: number; y: number; rot: number };
};

export function WriteWishForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>("write");
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function goBack() {
    if (step === "confirm") {
      setStep("write");
      return;
    }

    router.back();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step === "write") {
      setStep("confirm");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, anonymous, isPublic }),
      });

      if (response.status === 409) {
        toast.info("이번 달 무료 소원지는 이미 사용했어요.");
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) throw new Error("wish-failed");

      const wish = (await response.json()) as CreateWishResponse;
      trackEvent("paper_hung", { tier: "paper", isPaid: false });
      const query = new URLSearchParams({
        hung: "1",
        x: String(wish.slot.x),
        y: String(wish.slot.y),
      });

      router.replace(`/wishtree?${query.toString()}`);
    } catch {
      toast.error("소원을 걸지 못했습니다. 잠시 후 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="wish-night min-h-svh px-5 py-6 text-[#F6F2E9] sm:px-8">
      <button
        aria-label={
          step === "confirm" ? "작성 화면으로 돌아가기" : "소원나무로 돌아가기"
        }
        className="wish-icon-button"
        disabled={isSubmitting}
        onClick={goBack}
        type="button"
      >
        <ArrowLeft className="size-5" />
      </button>

      <form className="mx-auto mt-14 max-w-lg" onSubmit={submit}>
        <AnimatePresence initial={false} mode="wait">
          {step === "write" ? (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduceMotion ? 0 : -18 }}
              initial={{ opacity: 0, x: reduceMotion ? 0 : -18 }}
              key="write"
              transition={{ duration: reduceMotion ? 0 : 0.24 }}
            >
              <p className="wish-eyebrow">소원을 적어 걸기 · 1 / 2</p>
              <h1 className="wish-title mt-4 text-3xl">
                오늘, 나무에 남기고 싶은 마음
              </h1>
              <p className="wish-copy mt-4">
                소원지는 무료예요. 걸기 전에 한 번 더 확인할 수 있어요.
              </p>

              <label className="wish-paper mt-10 block">
                <span className="sr-only">소원</span>
                <textarea
                  autoFocus
                  className="min-h-48 w-full resize-none bg-transparent p-6 font-serif text-xl leading-9 text-[#3E2B1F] outline-none placeholder:text-[#5E6B5A]"
                  maxLength={60}
                  minLength={2}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="이루고 싶은 마음을 적어보세요"
                  required
                  value={text}
                />
                <span className="block px-6 pb-5 text-right text-sm text-[#5E6B5A]">
                  {text.length} / 60
                </span>
              </label>

              <label className="mt-4 flex min-h-12 items-center justify-between gap-4 text-base">
                <span>나무에 보이게 두기</span>
                <input
                  checked={isPublic}
                  className="size-5 accent-[#C6A24E]"
                  onChange={(event) => setIsPublic(event.target.checked)}
                  type="checkbox"
                />
              </label>
              <label className="mt-6 flex min-h-12 items-center justify-between gap-4 text-base">
                <span>이름을 남기지 않기</span>
                <input
                  checked={anonymous}
                  className="size-5 accent-[#C6A24E]"
                  onChange={(event) => setAnonymous(event.target.checked)}
                  type="checkbox"
                />
              </label>
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: reduceMotion ? 0 : 18 }}
              initial={{ opacity: 0, x: reduceMotion ? 0 : 18 }}
              key="confirm"
              transition={{ duration: reduceMotion ? 0 : 0.24 }}
            >
              <p className="wish-eyebrow">소원을 적어 걸기 · 2 / 2</p>
              <h1 className="wish-title mt-4 text-3xl">
                이 마음 그대로 걸까요?
              </h1>
              <p className="wish-copy mt-4">
                걸고 나면 소원은 밤의 나무에서 조용히 흔들려요.
              </p>

              <article className="wish-paper mt-10 min-h-64 p-7">
                <p className="font-serif text-xl leading-9 whitespace-pre-wrap text-[#3E2B1F]">
                  {text}
                </p>
                <div className="mt-10 flex flex-wrap gap-2 text-xs text-[#5E6B5A]">
                  <span className="rounded-full border border-[#5E6B5A]/25 px-3 py-1.5">
                    {isPublic ? "나무에 공개" : "뒷면만 공개"}
                  </span>
                  <span className="rounded-full border border-[#5E6B5A]/25 px-3 py-1.5">
                    {anonymous ? "익명" : "이름 표시"}
                  </span>
                </div>
              </article>

              <button
                className="mt-5 min-h-12 w-full text-sm text-[#E8EDF7] underline decoration-[#E8EDF7]/40 underline-offset-4"
                disabled={isSubmitting}
                onClick={() => setStep("write")}
                type="button"
              >
                다시 고치기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          className="wish-gold-button mt-8 w-full gap-2 disabled:cursor-wait disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
          {step === "write" ? "확인하기" : "이대로 나무에 걸기"}
        </button>
      </form>
    </main>
  );
}
