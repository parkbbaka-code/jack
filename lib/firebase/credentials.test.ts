import { describe, expect, it } from "vitest";

import { normalizeFirebasePrivateKey } from "./credentials";

describe("normalizeFirebasePrivateKey", () => {
  it("normalizes single and repeated escaped newlines", () => {
    expect(normalizeFirebasePrivateKey("header\\nbody")).toBe("header\nbody");
    expect(normalizeFirebasePrivateKey("header\\\\nbody")).toBe("header\nbody");
  });
});
