import { GROWTH_TARGET_WATER_COUNT } from "@/constants/growth";
import type { TreeStatus } from "@/types/models";

export function canBloomTree(status: TreeStatus, waterCount: number) {
  return status === "growing" && waterCount >= GROWTH_TARGET_WATER_COUNT;
}
