import { HeartHandshake } from "lucide-react";

import { getReturnMessage } from "@/features/tree/lib/return";

export function ReturnCard({ awayDays }: { awayDays: number }) {
  const message = getReturnMessage(awayDays);

  if (!message) return null;

  return (
    <section className="border-gold/25 bg-gold/5 relative mt-6 rounded-3xl border px-6 py-5">
      <div className="flex gap-3">
        <span className="bg-gold/15 flex size-10 shrink-0 items-center justify-center rounded-full">
          <HeartHandshake className="text-gold size-5" />
        </span>
        <div>
          <p className="text-gold text-xs font-semibold tracking-[0.16em]">
            WELCOME BACK
          </p>
          <p className="text-forest mt-2 font-serif leading-7">{message}</p>
        </div>
      </div>
    </section>
  );
}
