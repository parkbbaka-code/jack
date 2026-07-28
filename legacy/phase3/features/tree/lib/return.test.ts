import { describe, expect, it } from "vitest";

import {
  getAwayDays,
  getReturnMessage,
  getReturnTier,
} from "@/features/tree/lib/return";

describe("return experience", () => {
  it("counts calendar days in Korea", () => {
    expect(
      getAwayDays(
        new Date("2026-07-19T15:30:00.000Z"),
        new Date("2026-07-23T03:00:00.000Z"),
      ),
    ).toBe(3);
  });

  it("uses the v2 return tiers without guilt", () => {
    expect(getReturnTier(2)).toBe("none");
    expect(getReturnTier(3)).toBe("soft");
    expect(getReturnTier(7)).toBe("season");
    expect(getReturnTier(30)).toBe("wildflower");
    expect(getReturnTier(90)).toBe("company");
    expect(getReturnMessage(90)).toContain("반가워요");
  });
});
