import { describe, expect, it } from "vitest";
import { endOfBangkokDay, importantDate, readSmartDates } from "./smart-dates";

function entry(data: Record<string, string>) {
  const form = new FormData();
  for (const [k,v] of Object.entries(data)) form.set(k,v);
  return form;
}

describe("Smart Date schedule", () => {
  it("prioritizes deadline over event day, but archives after the event", () => {
    const s = readSmartDates(entry({ dateMode: "both", deadlineAt: "2026-11-15", deadlineLabel: "ปิดรับสมัคร", eventStart: "2026-11-20T06:30", eventEnd: "2026-11-20T12:00", archivePolicy: "AUTO" }));
    expect(s.deadlineAt?.toISOString()).toBe("2026-11-15T16:59:59.000Z");
    expect(s.expiresAt?.toISOString()).toBe("2026-11-20T16:59:59.000Z");
    expect(importantDate(s)?.label).toBe("ปิดรับสมัคร");
    expect(importantDate(s)?.text).toContain("15");
  });
  it("shows event range for an outage without miscalling it an application deadline", () => {
    const s = readSmartDates(entry({ dateMode: "period", eventStart: "2026-11-28T08:00", eventEnd: "2026-11-30T18:00", eventLabel: "งดใช้งาน", archivePolicy: "AUTO" }));
    expect(s.deadlineAt).toBeNull();
    expect(s.expiresAt?.toISOString()).toBe("2026-11-30T16:59:59.000Z");
    expect(importantDate(s)).toMatchObject({ label: "งดใช้งาน" });
    expect(importantDate(s)?.text).toContain("28–30");
  });
  it("no-date stays current indefinitely; custom archive date does not become a deadline", () => {
    expect(readSmartDates(entry({ dateMode: "none", archivePolicy: "AUTO" })).expiresAt).toBeNull();
    const custom = readSmartDates(entry({ dateMode: "none", archivePolicy: "CUSTOM", expiresAt: "2026-12-20" }));
    expect(custom.deadlineAt).toBeNull();
    expect(importantDate(custom)).toBeNull();
  });
  it("custom and never override automatic archiving", () => {
    const fd = { dateMode: "deadline", deadlineAt: "2026-11-15", archivePolicy: "NEVER" };
    expect(readSmartDates(entry(fd)).expiresAt).toBeNull();
    expect(readSmartDates(entry({ ...fd, archivePolicy: "CUSTOM", expiresAt: "2026-11-29" })).expiresAt?.toISOString()).toBe("2026-11-29T16:59:59.000Z");
  });
  it("rejects impossible dates, missing fields, and reversed ranges", () => {
    expect(() => readSmartDates(entry({ dateMode: "deadline", archivePolicy: "AUTO" }))).toThrow();
    expect(() => readSmartDates(entry({ dateMode: "deadline", deadlineAt: "2026-02-31", archivePolicy: "AUTO" }))).toThrow();
    expect(() => readSmartDates(entry({ dateMode: "period", eventStart: "2026-11-30T10:00", eventEnd: "2026-11-28T10:00", archivePolicy: "AUTO" }))).toThrow();
  });
  it("ends at Bangkok 23:59:59 even across UTC date boundaries", () => {
    expect(endOfBangkokDay(new Date("2026-12-31T18:00:00Z")).toISOString()).toBe("2027-01-01T16:59:59.000Z");
  });
});
