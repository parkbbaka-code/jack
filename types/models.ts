import type { Timestamp } from "firebase/firestore";

export type Visibility = "public" | "link" | "private";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type TreeStatus = "growing" | "bloomed" | "archived";

export interface GrowthState {
  waterCount: number;
  cheerCount: number;
  stageValue: number;
  bloomedAt: Timestamp | null;
}

export interface UserProfile {
  userId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  activeTreeId: string | null;
  onboardingCompleted: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Wish {
  wishId: string;
  ownerId: string;
  treeId: string;
  text: string;
  status: "active" | "fulfilled" | "archived";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Tree {
  treeId: string;
  ownerId: string;
  wishId: string;
  name: string;
  scope: Visibility;
  anonymous: boolean;
  status: TreeStatus;
  season: Season;
  growth: GrowthState;
  seed: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastWateredAt: Timestamp | null;
  fruitId: string | null;
}
