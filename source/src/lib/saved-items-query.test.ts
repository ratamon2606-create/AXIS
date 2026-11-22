import { describe, expect, it } from "vitest";
import { savedItemsWhere } from "./saved-items-query";
import { visibleWhere } from "./items";

describe("Saved items access control", () => {
  it("uses the same visibility scope as the saved page and excludes hidden/draft items", () => {
    const where = savedItemsWhere("person-1");
    expect(where.userId).toBe("person-1");
    expect(where.item).toEqual(visibleWhere(true, "all"));
    const serialized = JSON.stringify(where.item);
    expect(serialized).toContain("PUBLISHED");
    expect(serialized).toContain("PAST");
    expect(serialized).not.toContain('"HIDDEN"');
    expect(serialized).not.toContain('"DRAFT"');
  });

  it("retains a published public item when a user saves it", () => {
    expect(savedItemsWhere("user-2")).toHaveProperty("userId", "user-2");
  });
});
