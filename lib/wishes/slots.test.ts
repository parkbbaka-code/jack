import { describe, expect, it } from "vitest";

import { assignWishSlot } from "@/lib/wishes/slots";

describe("assignWishSlot", () => {
  it("keeps the same wish in the same saved position", () => {
    expect(assignWishSlot("wish-fixed-id")).toEqual(
      assignWishSlot("wish-fixed-id"),
    );
  });

  it("returns coordinates inside the tree canvas", () => {
    const slot = assignWishSlot("wish-coordinate-check");

    expect(slot.x).toBeGreaterThanOrEqual(0);
    expect(slot.x).toBeLessThanOrEqual(100);
    expect(slot.y).toBeGreaterThanOrEqual(0);
    expect(slot.y).toBeLessThanOrEqual(100);
  });
});
