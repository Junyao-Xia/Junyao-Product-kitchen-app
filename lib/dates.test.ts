import { describe, expect, it } from "vitest";
import {
  addDays,
  compareISODates,
  dayOffset,
  formatReminderLabel,
  isBeforeToday,
  parseISODate,
  toISODate,
} from "@/lib/dates";

describe("dates", () => {
  it("formats and parses ISO dates", () => {
    const date = new Date(2026, 8, 29);
    expect(toISODate(date)).toBe("2026-09-29");
    expect(parseISODate("2026-09-29")?.getDate()).toBe(29);
    expect(parseISODate("2026-13-01")).toBeNull();
  });

  it("adds days and compares dates", () => {
    expect(addDays("2026-09-29", 1)).toBe("2026-09-30");
    expect(compareISODates("2026-09-28", "2026-09-29")).toBeLessThan(0);
    expect(isBeforeToday("2026-09-28", "2026-09-29")).toBe(true);
  });

  it("labels reminder dates relative to today", () => {
    expect(formatReminderLabel("2026-09-28", "2026-09-29")).toBe(
      "Reminder yesterday",
    );
    expect(formatReminderLabel("2026-09-29", "2026-09-29")).toBe(
      "Reminder today",
    );
    expect(formatReminderLabel("2026-09-30", "2026-09-29")).toBe(
      "Reminder tomorrow",
    );
    expect(formatReminderLabel("2026-09-25", "2026-09-29")).toBe(
      "Reminder 4 days ago",
    );
    expect(formatReminderLabel("2026-10-04", "2026-09-29")).toBe(
      "Reminder in 5 days",
    );
  });

  it("rejects invalid dates", () => {
    expect(parseISODate("2026-02-30")).toBeNull();
    expect(parseISODate("bad-date")).toBeNull();
    expect(() => addDays("bad-date", 1)).toThrow("Invalid ISO date");
    expect(dayOffset("bad", "2026-09-29")).toBe(0);
  });
});
