import type { Audience, ItemType, Visibility } from "@prisma/client";
import { AUDIENCES, ITEM_TYPES, VISIBILITIES } from "@/lib/content-validation";
import { TYPE_FIELDS } from "@/lib/items";
import { readSmartDates } from "@/lib/smart-dates";

function formText(formData: FormData, field: string, fallback = ""): string {
  return String(formData.get(field) ?? fallback).trim();
}

export function parseTargetYear(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const year = Number(text);
  if (!Number.isInteger(year) || year < 1 || year > 8) {
    throw new Error("ชั้นปีไม่ถูกต้อง");
  }
  return year;
}

function readDetails(formData: FormData, type: ItemType): Record<string, string> {
  const details: Record<string, string> = {};
  for (const { key } of TYPE_FIELDS[type] ?? []) {
    const value = formText(formData, `d_${key}`);
    if (value) details[key] = value;
  }
  return details;
}

export function parseContentForm(formData: FormData) {
  const title = formText(formData, "title");
  const body = formText(formData, "body");
  const type = formText(formData, "type", "NEWS") as ItemType;
  const visibility = formText(formData, "visibility", "KU_ONLY") as Visibility;
  const audience = formText(formData, "audience") as Audience;

  const invalid: string[] = [];
  if (!title) invalid.push("หัวข้อ");
  if (!body) invalid.push("เนื้อหา");
  if (!ITEM_TYPES.includes(type)) invalid.push("ประเภทประกาศ");
  if (!VISIBILITIES.includes(visibility)) invalid.push("การมองเห็น");
  if (!AUDIENCES.includes(audience)) invalid.push("กลุ่มเป้าหมาย");

  if (invalid.length > 0) {
    throw new Error(`ยังไม่ได้กรอกหรือข้อมูลไม่ถูกต้อง: ${invalid.join(", ")}`);
  }

  return {
    title,
    body,
    type,
    audience,
    visibility,
    targetYear: parseTargetYear(formData.get("targetYear")),
    ...readSmartDates(formData),
    location: formText(formData, "location") || null,
    details: readDetails(formData, type),
  };
}
