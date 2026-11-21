import { describe, expect, it } from "vitest";
import { calendarMonth } from "@/lib/calendar-month";

describe("calendar month details", () => {
  it("counts leap and non-leap February days", () => {
    expect(calendarMonth("2028-02").days).toBe(29);
    expect(calendarMonth("2026-02").days).toBe(28);
  });

  it("finds the weekday the month starts on (0 = Sunday)", () => {
    expect(calendarMonth("2026-02").leading).toBe(0);
    expect(calendarMonth("2026-01").leading).toBe(4);
  });

  it("uses the Bangkok month when no month is requested", () => {
    // 2026-10-31 18:00 UTC is already 1 November in Bangkok (UTC+7).
    expect(calendarMonth(undefined, new Date("2026-10-31T18:00:00.000Z")).month).toBe(11);
    expect(calendarMonth(undefined, new Date("2026-10-31T16:59:00.000Z")).month).toBe(10);
  });

  it("ignores years outside 2000-2100", () => {
    const now = new Date("2026-11-08T00:00:00.000Z");
    expect(calendarMonth("1999-12", now).year).toBe(2026);
    expect(calendarMonth("2101-01", now).year).toBe(2026);
  });

  it("links neighbouring months across a year boundary", () => {
    const january = calendarMonth("2027-01");
    expect(january.previousKey).toBe("2026-12");
    expect(january.nextKey).toBe("2027-02");
  });
});
