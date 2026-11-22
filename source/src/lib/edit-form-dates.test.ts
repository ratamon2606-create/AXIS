import { describe, expect, it } from "vitest";
import { formatBangkokDate, formatBangkokDateTime, itemDateFormValues } from "./edit-form-dates";
import { readSmartDates } from "./smart-dates";

function toForm(values: ReturnType<typeof itemDateFormValues>) {
  const fd = new FormData();
  const hasDeadline = Boolean(values.deadlineAt);
  const hasPeriod = Boolean(values.eventStart);
  fd.set("dateMode", hasDeadline && hasPeriod ? "both" : hasDeadline ? "deadline" : hasPeriod ? "period" : "none");
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

describe("production edit-form date preservation", () => {
  it("formats Bangkok midnight and late-night times without AM/PM or UTC date drift", () => {
    expect(formatBangkokDateTime(new Date("2026-11-21T17:00:00.000Z"))).toBe("2026-11-22T00:00");
    expect(formatBangkokDateTime(new Date("2026-11-22T16:59:00.000Z"))).toBe("2026-11-22T23:59");
    expect(formatBangkokDate(new Date("2026-11-21T17:00:00.000Z"))).toBe("2026-11-22");
  });

  it("round trips a deadline, event window, labels and custom archive on an unrelated title edit", () => {
    const original = {
      deadlineAt: new Date("2026-11-20T16:59:59.000Z"),
      deadlineLabel: "ปิดรับสมัคร",
      eventStart: new Date("2026-11-21T03:15:00.000Z"),
      eventEnd: new Date("2026-11-21T08:45:00.000Z"),
      eventLabel: "วันแข่งขัน",
      archivePolicy: "CUSTOM" as const,
      expiresAt: new Date("2026-12-01T16:59:59.000Z"),
    };
    const result = readSmartDates(toForm(itemDateFormValues(original)));
    expect(result).toEqual(original);
  });

  it("preserves NEVER archive policy even with event dates", () => {
    const original = {
      deadlineAt: null,
      deadlineLabel: null,
      eventStart: new Date("2026-11-21T01:00:00.000Z"),
      eventEnd: null,
      eventLabel: "เริ่มกิจกรรม",
      archivePolicy: "NEVER" as const,
      expiresAt: null,
    };
    expect(readSmartDates(toForm(itemDateFormValues(original)))).toEqual(original);
  });
});
