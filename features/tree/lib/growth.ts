import {
  GROWTH_K,
  GROWTH_TARGET_WATER_COUNT,
  type GrowthStageId,
} from "@/constants/growth";

export interface GrowthSnapshot {
  stageValue: number;
  stage: GrowthStageId;
  waterCount: number;
}

export interface GrowthDetails {
  leaves: number;
  flowers: number;
  moss: number;
  birds: number;
}

export function getGrowthDetails(waterCount: number): GrowthDetails {
  const safeWaterCount = Math.max(0, Math.floor(waterCount));

  return {
    leaves: Math.floor(safeWaterCount * 2.5),
    flowers: Math.floor(safeWaterCount / 12),
    moss: Math.min(6, Math.floor(safeWaterCount / 9)),
    birds: Math.min(3, Math.floor(safeWaterCount / 40)),
  };
}

function getGrowthStage(stageValue: number): GrowthStageId {
  if (stageValue <= 0) return "seed";
  if (stageValue < 0.15) return "sprout";
  if (stageValue < 0.35) return "sapling";
  if (stageValue < 0.6) return "young-tree";
  if (stageValue < 0.85) return "mature-tree";

  return "ready-to-bloom";
}

export function calculateGrowth(waterCount: number): GrowthSnapshot {
  const safeWaterCount = Math.max(0, Math.floor(waterCount));
  const stageValue = Math.min(
    1,
    Math.log(1 + GROWTH_K * safeWaterCount) /
      Math.log(1 + GROWTH_K * GROWTH_TARGET_WATER_COUNT),
  );
  return {
    stageValue,
    stage: getGrowthStage(stageValue),
    waterCount: safeWaterCount,
  };
}
