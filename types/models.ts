import type { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider: "kakao" | "google";
  freePaperMonth: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface WishSlot {
  x: number;
  y: number;
  rot: number;
}

export interface Wish {
  wishId: string;
  ownerId: string;
  displayName: string | null;
  text: string;
  tier: "paper";
  variant: null;
  engraving: null;
  isPublic: boolean;
  anonymous: boolean;
  fulfilled: boolean;
  fulfilledAt: Timestamp | null;
  reportCount: number;
  hidden: boolean;
  takenDownAt: Timestamp | null;
  expiresAt: Timestamp;
  editableUntil: Timestamp;
  editCount: number;
  slot: WishSlot;
  shareId: string;
  treeId: null;
  createdAt: Timestamp;
}

export interface WishTreeStats {
  totalHung: number;
  totalFulfilled: number;
  pileCount: number;
  sampled: WishLite[];
  updatedAt: Timestamp;
}

export interface WishLite {
  wishId: string;
  text: string;
  displayName: string | null;
  tier: "paper";
  fulfilled: boolean;
  slot: WishSlot;
}
