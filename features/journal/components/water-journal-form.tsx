"use client";

import { type FormEvent, useState } from "react";
import { Droplets, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

const moods = [
  { id: "calm", label: "차분해요", emoji: "🌿" },
  { id: "grateful", label: "감사해요", emoji: "☀️" },
  { id: "hopeful", label: "기대돼요", emoji: "🌱" },
  { id: "tired", label: "조금 지쳐요", emoji: "🌙" },
] as const;

export function WaterJournalForm({
  treeId,
  onWatered,
}: {
  treeId: string;
  onWatered: () => void;
}) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState<(typeof moods)[number]["id"]>("calm");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/trees/${treeId}/water`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mood }),
      });

      if (response.status === 409) {
        toast.info("오늘은 이미 물을 주었어요. 내일 다시 만나요.");
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        throw new Error("watering-failed");
      }

      setText("");
      toast.success("오늘의 기록이 나무에 스며들었어요.");
      onWatered();
    } catch {
      toast.error("기록을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  }

  return (
    <section className="border-forest/10 relative mt-6 rounded-[2rem] border bg-white/55 p-6 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="bg-canopy/10 flex size-10 items-center justify-center rounded-full">
          <Droplets className="text-canopy size-5" />
        </span>
        <div>
          <h2 className="text-forest font-serif text-xl">오늘의 물 주기</h2>
          <p className="text-sub mt-1 text-sm">하루의 마음을 한 번 기록해요.</p>
        </div>
      </div>

      <form className="mt-5" onSubmit={handleSubmit}>
        <textarea
          className="border-forest/15 text-forest placeholder:text-sub/45 focus:border-canopy min-h-28 w-full resize-none rounded-3xl border bg-white/65 px-5 py-4 leading-7 outline-none"
          disabled={isSubmitting}
          maxLength={500}
          onChange={(event) => setText(event.target.value)}
          placeholder="오늘 소원을 위해 어떤 마음을 보냈나요?"
          required
          value={text}
        />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {moods.map((item) => (
            <label
              className="has-checked:border-canopy has-checked:bg-canopy/5 border-forest/10 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border bg-white/40 px-3 py-2.5 text-sm"
              key={item.id}
            >
              <input
                checked={mood === item.id}
                className="sr-only"
                disabled={isSubmitting}
                name="mood"
                onChange={() => setMood(item.id)}
                type="radio"
              />
              <span aria-hidden>{item.emoji}</span>
              <span className="text-forest">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sub text-xs">{text.length}/500</span>
          <button
            className="button-primary gap-2 disabled:cursor-wait disabled:opacity-60"
            disabled={isSubmitting || text.trim().length === 0}
            type="submit"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Droplets className="size-4" />
            )}
            기록하고 물 주기
          </button>
        </div>
      </form>
    </section>
  );
}
