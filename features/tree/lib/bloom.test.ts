import { describe, expect, it } from "vitest";

import { canBloomTree } from "@/features/tree/lib/bloom";

describe("canBloomTree", () => {
  it("allows a growing tree to bloom after 30 water records", () => {
    expect(canBloomTree("growing", 29)).toBe(false);
    expect(canBloomTree("growing", 30)).toBe(true);
  });

  it("does not bloom an already completed tree again", () => {
    expect(canBloomTree("bloomed", 30)).toBe(false);
    expect(canBloomTree("archived", 30)).toBe(false);
  });
});
