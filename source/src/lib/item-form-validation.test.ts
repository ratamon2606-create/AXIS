import { describe, expect, it } from "vitest";
import { validateItemForm } from "./item-form-validation";

function baseForm(): FormData {
  const form = new FormData();
  form.set("title", "Announcement");
  form.set("body", "Description");
  form.set("audience", "ALL");
  return form;
}

describe("editor form validation", () => {
  it("accepts a complete form without optional dates", () => {
    expect(validateItemForm(baseForm())).toEqual({});
  });

  it("identifies required fields", () => {
    const form = new FormData();
    expect(validateItemForm(form)).toMatchObject({
      title: expect.any(String),
      body: expect.any(String),
      audience: expect.any(String),
    });
  });

  it("requires a deadline for deadline mode", () => {
    const form = baseForm();
    form.set("dateMode", "deadline");
    expect(validateItemForm(form)).toHaveProperty("deadlineAt");
  });

  it("requires an event start for a period", () => {
    const form = baseForm();
    form.set("dateMode", "period");
    expect(validateItemForm(form)).toHaveProperty("eventStart");
  });

  it("requires an archival date for custom policy", () => {
    const form = baseForm();
    form.set("archivePolicy", "CUSTOM");
    expect(validateItemForm(form)).toHaveProperty("expiresAt");
  });

  it("rejects an event end before the start", () => {
    const form = baseForm();
    form.set("eventStart", "2026-11-20T10:00");
    form.set("eventEnd", "2026-11-19T10:00");
    expect(validateItemForm(form)).toHaveProperty("eventEnd");
  });
});
