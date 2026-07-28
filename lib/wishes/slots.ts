import slots from "@/constants/slots.json";

import type { WishSlot } from "@/types/models";

export interface WishSlotCandidate extends WishSlot {
  id: string;
}

const candidates = slots as WishSlotCandidate[];

export function assignWishSlot(wishId: string): WishSlot {
  let hash = 0;

  for (const character of wishId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  const candidate = candidates[hash % candidates.length];

  if (!candidate) {
    throw new Error("Wish slot candidates are not configured.");
  }

  return { x: candidate.x, y: candidate.y, rot: candidate.rot };
}
