import { describe, expect, it } from "vitest";
import { endDate, shortDate, fullDate, positionVars, bookTitleSize, type ShelfItem } from "./bookshelf-utils";
import { relevantDate } from "./items";

const sample: ShelfItem = {
  id: "1", title: "Engineering event", body: "Info", type: "ACTIVITY",
  audience: "ALL", targetYear: null,
  deadlineAt: "2026-11-15T16:59:59.000Z",
  eventStart: "2026-11-21T04:30:00.000Z",
  eventEnd: "2026-11-21T10:00:00.000Z",
  expiresAt: "2026-11-30T16:59:59.000Z",
  publishedAt: "2026-11-10T10:00:00.000Z",
  createdAt: "2026-11-01T12:00:00.000Z",
  location: null, saved: false, coverAttachmentId: null,
};

describe("bookshelf data and rendering helpers", () => {
  it("uses the central relevant-date priority for announcements with deadlines", () => {
    expect(relevantDate(sample).toISOString()).toBe(sample.deadlineAt);
    expect(relevantDate({ ...sample, deadlineAt: null }).toISOString()).toBe(sample.eventStart);
  });

  it("labels a real end/deadline instead of the archival date", () => {
    expect(endDate(sample)?.toISOString()).toBe(sample.deadlineAt);
    expect(endDate({ ...sample, deadlineAt: null })?.toISOString()).toBe(sample.eventEnd);
  });

  it("formats a fixed Bangkok date and 24-hour time", () => {
    expect(fullDate("2026-11-21T16:30:00Z")).toContain("23:30");
    expect(shortDate(new Date("2026-11-21T17:00:00Z"))).toContain("22");
  });

  it("returns stable positions and title-size styles", () => {
    expect(positionVars(0, true)).toBeTruthy();
    expect(bookTitleSize("Short")).toBe("axis-book-title-lg");
  });
});
