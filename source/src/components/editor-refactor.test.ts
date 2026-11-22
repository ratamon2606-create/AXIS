import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DateTime24Input from "@/components/DateTime24Input";
import { SmartDateFields } from "@/components/SmartDateFields";
import { ItemAccessFields } from "@/components/ItemAccessFields";

describe("refactored editor components", () => {
  it("preserves stored dates, event labels, and custom archive policy in edit markup", () => {
    const html = renderToStaticMarkup(createElement(SmartDateFields, {
      mode: "edit",
      values: {
        deadlineAt: "2026-11-20",
        deadlineLabel: "ปิดรับสมัคร",
        eventStart: "2026-11-22T14:30",
        eventEnd: "2026-11-22T17:45",
        eventLabel: "วันจัดงาน",
        archivePolicy: "CUSTOM",
        expiresAt: "2026-12-01",
      },
      errors: {}, field: "field", ok: "ok", bad: "bad",
    }));
    expect(html).toContain('name="deadlineAt"');
    expect(html).toContain('value="2026-11-20"');
    expect(html).toContain('name="eventStart"');
    expect(html).toContain('value="2026-11-22T14:30"');
    expect(html).toContain("วันจัดงาน");
    expect(html).toContain('name="expiresAt"');
    expect(html).toContain('value="2026-12-01"');
    expect(html).toContain('value="CUSTOM" selected=""');
  });

  it("renders 00-23 selection rather than browser-specific AM/PM", () => {
    const html = renderToStaticMarkup(createElement(DateTime24Input, {
      name: "eventStart", value: "2026-11-22T23:59", onChange: () => {},
      required: true,
    }));
    expect(html).toContain('name="eventStart"');
    expect(html).toContain('value="2026-11-22T23:59"');
    expect(html).toContain('value="23" selected=""');
    expect(html).toContain('value="59" selected=""');
    expect(html).not.toMatch(/AM\/PM/);
  });

  it("keeps selected visibility and existing published status", () => {
    const html = renderToStaticMarkup(createElement(ItemAccessFields, {
      mode: "edit", initialVisibility: "PUBLIC", status: "PUBLISHED", field: "", ok: "",
    }));
    expect(html).toContain('name="visibility" value="PUBLIC"');
    expect(html).toContain('name="status" value="PUBLISHED"');
  });
});
