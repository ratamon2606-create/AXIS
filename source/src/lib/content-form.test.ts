import { describe, expect, it } from "vitest";
import { parseContentForm, parseTargetYear } from "./content-form";

function validForm(): FormData {
  const form = new FormData();
  form.set("title", " Example ");
  form.set("body", " Details ");
  form.set("type", "OPPORTUNITY");
  form.set("audience", "ALL");
  form.set("visibility", "PUBLIC");
  form.set("d_qualification", " Students ");
  return form;
}

describe("content form parsing", () => {
  it("trims text and extracts only applicable details", () => {
    const result = parseContentForm(validForm());
    expect(result.title).toBe("Example");
    expect(result.body).toBe("Details");
    expect(result.details).toEqual({ qualification: "Students" });
    expect(result.targetYear).toBeNull();
  });

  it("defaults the visibility and type", () => {
    const form = validForm();
    form.delete("visibility");
    form.delete("type");
    const result = parseContentForm(form);
    expect(result.visibility).toBe("KU_ONLY");
    expect(result.type).toBe("NEWS");
    expect(result.details).toEqual({});
  });

  it("rejects invalid and missing required fields", () => {
    const form = validForm();
    form.delete("title");
    form.set("type", "UNKNOWN");
    expect(() => parseContentForm(form)).toThrow(/หัวข้อ.*ประเภทประกาศ/);
  });

  it("rejects invalid year values", () => {
    for (const input of ["0", "9", "abc", "2.5", "-1"]) {
      expect(() => parseTargetYear(input)).toThrow("ชั้นปีไม่ถูกต้อง");
    }
  });

  it("accepts a blank or valid target year", () => {
    expect(parseTargetYear(null)).toBeNull();
    expect(parseTargetYear(" 3 ")).toBe(3);
  });

  it("keeps the optional date policy independent from the publication date", () => {
    const form = validForm();
    form.set("dateMode", "none");
    form.set("archivePolicy", "NEVER");
    const result = parseContentForm(form);
    expect(result.deadlineAt).toBeNull();
    expect(result.expiresAt).toBeNull();
  });
});
