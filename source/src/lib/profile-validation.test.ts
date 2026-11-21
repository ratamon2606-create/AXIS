import { describe, expect, it } from "vitest";
import { validateProfile } from "@/lib/profile-validation";

describe("profile validation", () => {
  it("accepts every supported program with a year from 1 to 8", () => {
    expect(validateProfile("CPE", 1)).toBeNull();
    expect(validateProfile("SKE", 8)).toBeNull();
  });

  it("rejects a missing or unknown program", () => {
    expect(validateProfile("", 2)).toBe("กรุณาเลือกหลักสูตร");
    expect(validateProfile("ABC", 2)).toBe("กรุณาเลือกหลักสูตร");
    expect(validateProfile("cpe", 2)).toBe("กรุณาเลือกหลักสูตร");
  });

  it("rejects years outside 1-8 and non-integer years", () => {
    for (const year of [0, 9, -1, 2.5, Number.NaN]) {
      expect(validateProfile("CPE", year)).toBe("กรุณาเลือกชั้นปี");
    }
  });

  it("reports the program problem before the year problem", () => {
    expect(validateProfile("", 0)).toBe("กรุณาเลือกหลักสูตร");
  });
});
