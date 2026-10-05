import { describe, expect, it } from "vitest";
import { audienceMatches, canEditItem, isPast, visibleWhere } from "@/lib/items";

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
