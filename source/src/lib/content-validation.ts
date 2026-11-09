import type { Audience, ItemType, Visibility } from "@prisma/client";

export const AUDIENCES: Audience[] = ["ALL", "CPE", "SKE", "CPE_SKE"];
export const ITEM_TYPES: ItemType[] = ["NEWS", "OPPORTUNITY", "ACTIVITY", "ALERT", "DOCUMENT"];
export const VISIBILITIES: Visibility[] = ["KU_ONLY", "PUBLIC"];

function validDateComponents(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Interpret HTML date/datetime-local in Bangkok, without server-host timezone. */
export function parseBangkokDate(value: FormDataEntryValue | null): Date | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) throw new Error("วันที่ไม่ถูกต้อง");
  const [year, month, day] = match.slice(1).map(Number);
  if (!validDateComponents(year, month, day)) throw new Error("วันที่ไม่ถูกต้อง");
  return new Date(Date.UTC(year, month - 1, day, 16, 59, 59));
}

export function parseBangkokDateTime(value: FormDataEntryValue | null): Date | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(text);
  if (!match) throw new Error("วันเวลาไม่ถูกต้อง");
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (!validDateComponents(year, month, day) || hour > 23 || minute > 59) throw new Error("วันเวลาไม่ถูกต้อง");
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute));
}

export function validateDateOrder(eventStart: Date | null, eventEnd: Date | null): void {
  if (eventEnd && !eventStart) throw new Error("กรุณาระบุวันเริ่มกิจกรรมก่อนระบุวันจบ");
  if (eventStart && eventEnd && eventEnd < eventStart) throw new Error("วันจบกิจกรรมต้องไม่ก่อนวันเริ่ม");
}
