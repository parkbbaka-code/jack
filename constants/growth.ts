export const GROWTH_K = 0.3;
export const GROWTH_TARGET_WATER_COUNT = 60;

export const GROWTH_STAGES = [
  { id: "seed", min: 0 },
  { id: "sprout", min: 0.15 },
  { id: "sapling", min: 0.35 },
  { id: "young-tree", min: 0.6 },
  { id: "mature-tree", min: 0.85 },
  { id: "ready-to-bloom", min: 1 },
] as const;

export type GrowthStageId = (typeof GROWTH_STAGES)[number]["id"];
