import { describe, expect, it } from "vitest";
import { assertEditableFollowUp, assertFollowUpImageCount, readFollowUpFields } from "./follow-ups";

const parent = { id: "parent", parentId: null, status: "PUBLISHED" };
const update = { parentId: "parent", status: "PUBLISHED" };

describe("follow-up editing rules", () => {
  it("trims the title and body", () => {
    const fd = new FormData();
    fd.set("title", "  อัปเดตใหม่  ");
    fd.set("body", "  เนื้อหา  ");
    expect(readFollowUpFields(fd)).toEqual({ title: "อัปเดตใหม่", body: "เนื้อหา" });
  });
  it("rejects empty title and body", () => {
    expect(() => readFollowUpFields(new FormData())).toThrow("ต้องกรอก");
  });
  it("rejects overlong content", () => {
    const fd = new FormData(); fd.set("title", "x".repeat(301)); fd.set("body", "ok");
    expect(() => readFollowUpFields(fd)).toThrow("ยาวเกินไป");
  });
  it("allows editing a follow-up of a published main item", () => {
    expect(() => assertEditableFollowUp(update, parent)).not.toThrow();
  });
  it("allows editing an existing follow-up after its main item becomes past", () => {
    expect(() => assertEditableFollowUp(update, { ...parent, status: "PAST" })).not.toThrow();
  });
  it("rejects editing a main announcement as a follow-up", () => {
    expect(() => assertEditableFollowUp({ parentId: null, status: "PUBLISHED" }, parent)).toThrow();
  });
  it("rejects when the parent is hidden", () => {
    expect(() => assertEditableFollowUp(update, { ...parent, status: "HIDDEN" })).toThrow();
  });
  it("rejects hidden follow-ups and missing parents", () => {
    expect(() => assertEditableFollowUp({ ...update, status: "HIDDEN" }, parent)).toThrow();
    expect(() => assertEditableFollowUp(update, null)).toThrow();
  });
  it("accepts up to four images in total", () => {
    expect(() => assertFollowUpImageCount(2, 2)).not.toThrow();
    expect(() => assertFollowUpImageCount(4, 0)).not.toThrow();
  });
  it("rejects more than four images or invalid counts", () => {
    expect(() => assertFollowUpImageCount(3, 2)).toThrow("สูงสุด 4 รูป");
    expect(() => assertFollowUpImageCount(-1, 1)).toThrow();
  });
});
