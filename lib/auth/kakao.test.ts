import { describe, expect, it } from "vitest";

import { getSafeNextPath } from "@/lib/auth/kakao";

describe("getSafeNextPath", () => {
  it("keeps internal application paths", () => {
    expect(getSafeNextPath("/wish/new")).toBe("/wish/new");
  });

  it("rejects external and protocol-relative paths", () => {
    expect(getSafeNextPath("https://example.com")).toBe("/wishtree");
    expect(getSafeNextPath("//example.com")).toBe("/wishtree");
    expect(getSafeNextPath(undefined)).toBe("/wishtree");
  });
});
