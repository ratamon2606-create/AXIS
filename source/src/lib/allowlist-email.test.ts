import { describe, expect, it } from "vitest";
import { normalizeAllowlistEmail } from "@/lib/allowlist-email";

describe("allowlist email normalization", () => {
  it("trims and lowercases a valid address", () => {
    expect(normalizeAllowlistEmail("  Student@KU.th ")).toBe("student@ku.th");
  });

  it("rejects values that only contain an at sign", () => {
    for (const bad of ["@", "a@", "@ku.th", "a@ku", "a b@ku.th", "a@@ku.th", "", null, undefined]) {
      expect(normalizeAllowlistEmail(bad)).toBeNull();
    }
  });

  it("rejects an address longer than 254 characters", () => {
    expect(normalizeAllowlistEmail(`${"a".repeat(250)}@ku.th`)).toBeNull();
  });
});
