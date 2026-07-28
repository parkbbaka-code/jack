"use client";

import { type FormEvent, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function WriteWishForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

      router.replace("/wishtree?hung=1");
    } catch {
      toast.error("소원을 걸지 못했습니다. 잠시 후 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="wish-night min-h-svh px-5 py-6 text-[#F6F2E9] sm:px-8">
      <button
        aria-label="소원나무로 돌아가기"
        className="wish-icon-button"
        onClick={() => router.back()}
        type="button"
      >
        <ArrowLeft className="size-5" />
      </button>
      <form className="mx-auto mt-14 max-w-lg" onSubmit={submit}>
        <p className="wish-eyebrow">소원을 적어 걸기 · 1 / 1</p>
        <h1 className="wish-title mt-4">오늘, 나무에 남기고 싶은 마음</h1>
        <p className="wish-copy mt-4">소원지는 무료예요. 조용히 걸어둘게요.</p>
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
        <button
          className="wish-gold-button mt-8 w-full"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
          나무에 걸기
        </button>
      </form>
    </main>
  );
}
