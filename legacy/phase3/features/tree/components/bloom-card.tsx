"use client";

import { useState } from "react";
import { Flower2, LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { canBloomTree } from "@/features/tree/lib/bloom";
import type { Tree } from "@/types/models";

export function BloomCard({
  tree,
  onBloomed,
}: {
  tree: Tree;
  onBloomed: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (tree.status === "bloomed") {
    return (
      <section className="border-canopy/15 relative mt-6 overflow-hidden rounded-[2rem] border bg-white/60 p-6 text-center shadow-sm backdrop-blur-md">
        <Sparkles aria-hidden className="text-sun mx-auto size-6" />
        <p className="text-canopy mt-3 text-xs font-semibold tracking-[0.18em]">
          WISH IN BLOOM
        </p>
        <h2 className="text-forest mt-3 font-serif text-2xl">
          소원이 아름답게 꽃피었어요.
        </h2>
        <p className="text-sub mt-3 text-sm leading-6">
          서른 번의 마음이 한 송이씩 피어났습니다. 이 여정은 곧 열매로 간직할 수
          있어요.
        </p>
      </section>
    );
  }

  if (!canBloomTree(tree.status, tree.growth.waterCount)) return null;

  async function handleBloom() {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/trees/${tree.treeId}/bloom`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("bloom-failed");

      toast.success("서른 번의 마음이 꽃으로 피어났어요.");
      onBloomed();
    } catch {
      toast.error("꽃을 피우지 못했습니다. 잠시 후 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  }

  return (
    <section className="border-sun/30 bg-sun/10 relative mt-6 rounded-[2rem] border p-6 text-center shadow-sm">
      <Flower2 aria-hidden className="text-canopy mx-auto size-7" />
      <p className="text-canopy mt-3 text-xs font-semibold tracking-[0.18em]">
        30 DAYS COMPLETE
      </p>
      <h2 className="text-forest mt-3 font-serif text-2xl">
        꽃피울 준비가 되었어요.
      </h2>
      <p className="text-sub mt-3 text-sm leading-6">
        서른 번의 기록을 돌아보고, 준비가 되었다면 소원을 꽃피워 주세요.
      </p>
      <button
        className="button-primary mt-5 gap-2 disabled:cursor-wait disabled:opacity-60"
        disabled={isSubmitting}
        onClick={handleBloom}
        type="button"
      >
        {isSubmitting ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Flower2 className="size-4" />
        )}
        소원 꽃피우기
      </button>
    </section>
  );
}
