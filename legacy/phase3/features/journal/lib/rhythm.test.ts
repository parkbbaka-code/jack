import { describe, expect, it } from "vitest";

import { describeRhythm } from "@/features/journal/lib/rhythm";

describe("describeRhythm", () => {
  it("never frames a gap as a failure", () => {
    expect(describeRhythm([], "2026-07-27")).toBeNull();
    expect(describeRhythm(["2026-07-27"], "2026-07-27")).toContain("한 걸음");
    expect(
      describeRhythm(["2026-07-01", "2026-07-20"], "2026-07-27"),
    ).toContain("충분히");
  });
});
