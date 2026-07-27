import { describe, expect, it } from "vitest";

import { GROWTH_TARGET_WATER_COUNT } from "@/constants/growth";
import { calculateGrowth, getGrowthDetails } from "@/features/tree/lib/growth";

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

  it("makes the first water visibly meaningful and reaches the v2 milestones", () => {
    expect(calculateGrowth(1).stage).toBe("sprout");
    expect(calculateGrowth(1).stageValue).toBeCloseTo(0.089, 3);
    expect(calculateGrowth(3).stage).toBe("sapling");
    expect(calculateGrowth(10).stage).toBe("young-tree");
    expect(calculateGrowth(20).stage).toBe("mature-tree");
    expect(calculateGrowth(45).stage).toBe("ready-to-bloom");
    expect(calculateGrowth(60).stage).toBe("ready-to-bloom");
  });

  it("adds visual details on every water record", () => {
    expect(getGrowthDetails(0).leaves).toBe(0);
    expect(getGrowthDetails(1).leaves).toBeGreaterThan(0);
    expect(getGrowthDetails(2).leaves).toBeGreaterThan(
      getGrowthDetails(1).leaves,
    );
    expect(getGrowthDetails(60)).toEqual({
      leaves: 150,
      flowers: 5,
      moss: 6,
      birds: 1,
    });
  });

  it("does not allow negative growth", () => {
    expect(calculateGrowth(-10)).toEqual({
      stage: "seed",
      stageValue: 0,
      waterCount: 0,
    });
  });
});
