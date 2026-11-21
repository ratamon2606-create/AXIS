import { describe, expect, it } from "vitest";
import { audienceMatches, canEditItem, canReadItem, daysLeft, isPast, relevantDate, visibleWhere } from "@/lib/items";

const now = new Date("2026-10-05T00:00:00.000Z");

describe("audienceMatches", () => {
  it("shows ALL announcements to everyone, including users without a program", () => {
    expect(audienceMatches("ALL", "CPE")).toBe(true);
    expect(audienceMatches("ALL", null)).toBe(true);
    expect(audienceMatches("ALL", undefined)).toBe(true);
  });

  it("matches single-program audiences only for that program", () => {
    expect(audienceMatches("CPE", "CPE")).toBe(true);
    expect(audienceMatches("CPE", "SKE")).toBe(false);
    expect(audienceMatches("SKE", "SKE")).toBe(true);
    expect(audienceMatches("SKE", "CPE")).toBe(false);
  });

  it("hides program-specific announcements from users who have no program", () => {
    expect(audienceMatches("CPE", null)).toBe(false);
    expect(audienceMatches("CPE_SKE", null)).toBe(false);
  });

  it("does not match an unknown audience value", () => {
    expect(audienceMatches("UNKNOWN", "CPE")).toBe(false);
  });
});

describe("canReadItem for archived items", () => {
  it("lets a visitor read a public past item but not a KU-only one", () => {
    expect(canReadItem({ status: "PAST", visibility: "PUBLIC" }, false)).toBe(true);
    expect(canReadItem({ status: "PAST", visibility: "KU_ONLY" }, false)).toBe(false);
  });

  it("lets a signed-in user read a KU-only past item", () => {
    expect(canReadItem({ status: "PAST", visibility: "KU_ONLY" }, true)).toBe(true);
  });
});

describe("canEditItem for readers", () => {
  it("never lets a reader edit, even their own item", () => {
    expect(canEditItem({ id: "a", role: "READER" }, { authorId: "a" })).toBe(false);
  });
});

describe("daysLeft", () => {
  it("returns null when there is no expiry", () => {
    expect(daysLeft(null, now)).toBeNull();
  });

  it("counts whole days and rounds partial days up", () => {
    expect(daysLeft(new Date("2026-10-06T00:00:00.000Z"), now)).toBe(1);
    expect(daysLeft(new Date("2026-10-06T00:00:01.000Z"), now)).toBe(2);
  });

  it("returns a negative number once the date has passed", () => {
    expect(daysLeft(new Date("2026-10-03T00:00:00.000Z"), now)).toBe(-2);
  });
});

describe("isPast", () => {
  it("treats a manually closed item as past", () => {
    expect(isPast({ status: "PAST", expiresAt: null }, now)).toBe(true);
  });

  it("never treats drafts or hidden items as past, even with an old expiry", () => {
    const old = new Date("2026-01-01T00:00:00.000Z");
    expect(isPast({ status: "DRAFT", expiresAt: old }, now)).toBe(false);
    expect(isPast({ status: "HIDDEN", expiresAt: old }, now)).toBe(false);
  });

  it("is not past at the exact expiry moment", () => {
    expect(isPast({ status: "PUBLISHED", expiresAt: now }, now)).toBe(false);
  });
});

describe("relevantDate", () => {
  const createdAt = new Date("2026-10-01T00:00:00.000Z");
  const publishedAt = new Date("2026-10-02T00:00:00.000Z");
  const deadlineAt = new Date("2026-10-10T00:00:00.000Z");

  it("prefers an explicit deadline over every other date", () => {
    expect(relevantDate({ type: "ACTIVITY", eventStart: publishedAt, expiresAt: null, deadlineAt, publishedAt, createdAt })).toBe(deadlineAt);
  });

  it("falls back to the published date, then the created date", () => {
    expect(relevantDate({ type: "NEWS", eventStart: null, expiresAt: null, publishedAt, createdAt })).toBe(publishedAt);
    expect(relevantDate({ type: "NEWS", eventStart: null, expiresAt: null, publishedAt: null, createdAt })).toBe(createdAt);
  });

  it("ignores a missing event start for activities", () => {
    expect(relevantDate({ type: "ACTIVITY", eventStart: null, expiresAt: null, publishedAt, createdAt })).toBe(publishedAt);
  });
});

describe("visibleWhere", () => {
  it("only lists top-level announcements, never follow-ups", () => {
    expect(visibleWhere(true, "current", now)).toMatchObject({ parentId: null });
  });

  it("does not restrict visibility for signed-in users", () => {
    expect(visibleWhere(true, "current", now)).not.toHaveProperty("visibility");
  });

  it("combines current and past rules for the all scope", () => {
    const where = visibleWhere(false, "all", now);
    expect(where).toMatchObject({ visibility: "PUBLIC", parentId: null });
    expect(where.OR).toHaveLength(2);
  });
});
