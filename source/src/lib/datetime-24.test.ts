import { describe, expect, it } from "vitest";
import { joinDateTime24, splitDateTime24 } from "./datetime-24";

describe("24-hour editor date/time values", () => {
  it("preserves midnight and the latest hour without AM/PM conversion", () => {
    expect(splitDateTime24("2026-11-22T00:00")).toEqual({
      date: "2026-11-22", hour: "00", minute: "00",
    });
    expect(splitDateTime24("2026-11-22T23:59")).toEqual({
      date: "2026-11-22", hour: "23", minute: "59",
    });
    expect(joinDateTime24("2026-11-22", "23", "59")).toBe("2026-11-22T23:59");
  });

  it("defaults an unset time to 00:00 without creating a date", () => {
    expect(splitDateTime24("")).toEqual({ date: "", hour: "00", minute: "00" });
    expect(joinDateTime24("", "09", "30")).toBe("");
  });

  it("rejects invalid or 12-hour input values", () => {
    expect(splitDateTime24("2026-11-22T24:00")).toEqual({ date: "", hour: "00", minute: "00" });
    expect(splitDateTime24("2026-11-22T11:30 PM")).toEqual({ date: "", hour: "00", minute: "00" });
  });

  it("round trips an existing 24-hour editing value", () => {
    const original = "2026-12-01T16:45";
    const parts = splitDateTime24(original);
    expect(joinDateTime24(parts.date, parts.hour, parts.minute)).toBe(original);
  });
});
