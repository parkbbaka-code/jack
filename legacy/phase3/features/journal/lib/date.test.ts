import { describe, expect, it } from "vitest";

import {
  formatJournalDate,
  getKoreanDateId,
} from "@/features/journal/lib/date";

describe("journal dates", () => {
  it("uses the Korean calendar day", () => {
    expect(getKoreanDateId(new Date("2026-07-27T15:30:00.000Z"))).toBe(
      "2026-07-28",
    );
  });

  it("formats a journal id for display", () => {
    expect(formatJournalDate("2026-07-28")).toBe("7월 28일");
  });
});
