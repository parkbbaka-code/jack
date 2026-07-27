import { describe, expect, it } from "vitest";

import { GROWTH_TARGET_WATER_COUNT } from "@/constants/growth";
import { calculateGrowth } from "@/features/tree/lib/growth";

describe("calculateGrowth", () => {
  it("starts from a seed", () => {
    expect(calculateGrowth(0)).toEqual({
      stage: "seed",
      stageValue: 0,
      waterCount: 0,
    });
  });

  it("grows only from water records and caps at one", () => {
    expect(calculateGrowth(GROWTH_TARGET_WATER_COUNT).stageValue).toBe(1);
    expect(calculateGrowth(GROWTH_TARGET_WATER_COUNT * 2).stageValue).toBe(1);
  });

  it("reaches visible milestones over 30 daily water records", () => {
    expect(calculateGrowth(3).stage).toBe("sprout");
    expect(calculateGrowth(8).stage).toBe("sapling");
    expect(calculateGrowth(15).stage).toBe("young-tree");
    expect(calculateGrowth(24).stage).toBe("mature-tree");
    expect(calculateGrowth(30).stage).toBe("ready-to-bloom");
  });

  it("does not allow negative growth", () => {
    expect(calculateGrowth(-10)).toEqual({
      stage: "seed",
      stageValue: 0,
      waterCount: 0,
    });
  });
});
