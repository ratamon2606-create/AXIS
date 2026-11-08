import { describe, expect, it } from "vitest";
import { parseBangkokDate, parseBangkokDateTime, validateDateOrder } from "@/lib/content-validation";
import { calendarMonth } from "@/lib/calendar-month";
import { canReadItemWithParent } from "@/lib/items";

describe("Bangkok date validation", () => {
  it("rejects invalid calendar days instead of silently normalizing", () => {
    expect(() => parseBangkokDate("2026-02-31")).toThrow();
    expect(() => parseBangkokDateTime("2026-04-31T19:00")).toThrow();
    expect(() => parseBangkokDateTime("2026-05-10T25:00")).toThrow();
  });
  it("accepts leap day and enforces event order", () => {
    expect(parseBangkokDate("2028-02-29")?.toISOString()).toBe("2028-02-29T16:59:59.000Z");
    const start = parseBangkokDateTime("2026-11-08T20:00");
    const end = parseBangkokDateTime("2026-11-08T10:00");
    expect(() => validateDateOrder(start, end)).toThrow();
  });
});

describe("Calendar stable regardless of host timezone", () => {
  it("computes November 2026 and next month correctly", () => {
    const m = calendarMonth("2026-11");
    expect(m.start.toISOString()).toBe("2026-10-31T17:00:00.000Z");
    expect(m.next.toISOString()).toBe("2026-11-30T17:00:00.000Z");
    expect(m.days).toBe(30);
    expect(m.leading).toBe(0);
    expect(m.nextKey).toBe("2026-12");
  });
  it("crosses years and ignores invalid month keys", () => {
    expect(calendarMonth("2026-12").nextKey).toBe("2027-01");
    expect(calendarMonth("2027-01").previousKey).toBe("2026-12");
    expect(calendarMonth("2026-13", new Date("2026-11-08T00:00:00.000Z")).month).toBe(11);
  });
});

describe("Thread inheritance", () => {
  const child = { status: "PUBLISHED", visibility: "PUBLIC" };
  it("blocks children of hidden or draft parents", () => {
    expect(canReadItemWithParent({ ...child, parent: { status: "HIDDEN", visibility: "PUBLIC" } }, true)).toBe(false);
    expect(canReadItemWithParent({ ...child, parent: { status: "DRAFT", visibility: "PUBLIC" } }, true)).toBe(false);
  });
  it("does not leak public child when parent becomes KU-only", () => {
    expect(canReadItemWithParent({ ...child, parent: { status: "PUBLISHED", visibility: "KU_ONLY" } }, false)).toBe(false);
  });
});
