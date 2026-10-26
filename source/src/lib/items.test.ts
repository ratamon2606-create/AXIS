import { describe, expect, it } from "vitest";
import { audienceMatches, canEditItem, canReadItem, daysLeft, feedOrder, isPast, relevantDate, visibleWhere } from "@/lib/items";

const now = new Date("2026-10-05T00:00:00.000Z");

describe("visibleWhere", () => {
  it("keeps public-only rule for visitors", () => {
    expect(visibleWhere(false, "current", now)).toMatchObject({ visibility: "PUBLIC", status: "PUBLISHED" });
  });

  it("includes manual and automatic past items", () => {
    const where = visibleWhere(true, "past", now);
    expect(where).toHaveProperty("OR");
  });
});

describe("isPast", () => {
  it("treats expired published items as past", () => {
    expect(isPast({ status: "PUBLISHED", expiresAt: new Date("2026-10-01T00:00:00.000Z") }, now)).toBe(true);
  });

  it("keeps no-expiry published items current", () => {
    expect(isPast({ status: "PUBLISHED", expiresAt: null }, now)).toBe(false);
  });
});

describe("ownership", () => {
  it("lets an editor edit only their own post", () => {
    expect(canEditItem({ id: "a", role: "EDITOR" }, { authorId: "a" })).toBe(true);
    expect(canEditItem({ id: "a", role: "EDITOR" }, { authorId: "b" })).toBe(false);
  });

  it("lets admin override ownership", () => {
    expect(canEditItem({ id: "a", role: "ADMIN" }, { authorId: "b" })).toBe(true);
  });
});

describe("audience", () => {
  it("handles CPE & SKE audience", () => {
    expect(audienceMatches("CPE_SKE", "CPE")).toBe(true);
    expect(audienceMatches("CPE_SKE", "SKE")).toBe(true);
  });
});

describe("read access", () => {
  it("allows a visitor to read a public published item", () => {
    expect(canReadItem({ status: "PUBLISHED", visibility: "PUBLIC" }, false)).toBe(true);
  });

  it("denies KU-only content to a visitor", () => {
    expect(canReadItem({ status: "PUBLISHED", visibility: "KU_ONLY" }, false)).toBe(false);
  });

  it("keeps draft and hidden items out of normal signed-in reads", () => {
    expect(canReadItem({ status: "DRAFT", visibility: "KU_ONLY" }, true)).toBe(false);
    expect(canReadItem({ status: "HIDDEN", visibility: "KU_ONLY" }, true)).toBe(false);
  });
});

describe("dates and ordering", () => {
  it("rounds remaining partial days up for deadline display", () => {
    const start = new Date("2026-10-05T00:00:00.000Z");
    const deadline = new Date("2026-10-06T12:00:00.000Z");
    expect(daysLeft(deadline, start)).toBe(2);
  });

  it("uses activity start and opportunity expiry as the relevant date", () => {
    const createdAt = new Date("2026-10-01T00:00:00.000Z");
    const publishedAt = new Date("2026-10-02T00:00:00.000Z");
    const eventStart = new Date("2026-10-20T00:00:00.000Z");
    const expiresAt = new Date("2026-10-15T00:00:00.000Z");

    expect(relevantDate({ type: "ACTIVITY", eventStart, expiresAt, publishedAt, createdAt })).toBe(eventStart);
    expect(relevantDate({ type: "OPPORTUNITY", eventStart, expiresAt, publishedAt, createdAt })).toBe(expiresAt);
  });

  it("keeps pinned content before created-date ordering", () => {
    expect(feedOrder).toEqual([{ pinned: "desc" }, { createdAt: "desc" }]);
  });
});

