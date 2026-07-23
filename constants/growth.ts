export const GROWTH_TARGET_WATER_COUNT = 72;

export const GROWTH_STAGES = [
  { id: "seed", min: 0 },
  { id: "sprout", min: 0.08 },
  { id: "sapling", min: 0.25 },
  { id: "young-tree", min: 0.5 },
  { id: "mature-tree", min: 0.8 },
  { id: "ready-to-bloom", min: 1 },
] as const;

export type GrowthStageId = (typeof GROWTH_STAGES)[number]["id"];
