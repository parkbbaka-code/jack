import {
  GROWTH_STAGES,
  GROWTH_TARGET_WATER_COUNT,
  type GrowthStageId,
} from "@/constants/growth";

export interface GrowthSnapshot {
  stageValue: number;
  stage: GrowthStageId;
  waterCount: number;
}

export function calculateGrowth(waterCount: number): GrowthSnapshot {
  const safeWaterCount = Math.max(0, Math.floor(waterCount));
  const stageValue = Math.min(1, safeWaterCount / GROWTH_TARGET_WATER_COUNT);
  const stage = [...GROWTH_STAGES]
    .reverse()
    .find((candidate) => stageValue >= candidate.min)?.id;

  return {
    stageValue,
    stage: stage ?? "seed",
    waterCount: safeWaterCount,
  };
}
