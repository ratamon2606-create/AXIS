import { parseBangkokDate, parseBangkokDateTime, validateDateOrder } from "@/lib/content-validation";

export type DateMode = "none" | "deadline" | "period" | "both";
export type ArchivePolicy = "AUTO" | "CUSTOM" | "NEVER";

export type SmartDateFields = {
  deadlineAt: Date | null;
  deadlineLabel: string | null;
  eventStart: Date | null;
  eventEnd: Date | null;
  eventLabel: string | null;
  archivePolicy: ArchivePolicy;
  expiresAt: Date | null;
};

function requiredDate(value: FormDataEntryValue | null, label: string): Date {
  const result = parseBangkokDate(value);
  if (!result) throw new Error(`กรุณาระบุ${label}`);
  return result;
}

/** Inclusive Bangkok calendar day, not 00:00 UTC or the Vercel host timezone. */
export function endOfBangkokDay(date: Date): Date {
  const local = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 16, 59, 59));
}

export function readSmartDates(fd: FormData): SmartDateFields {
  const rawMode = String(fd.get("dateMode") ?? "none");
  if (!["none", "deadline", "period", "both"].includes(rawMode)) throw new Error("ประเภทวันที่ไม่ถูกต้อง");
  const mode = rawMode as DateMode;
  const hasDeadline = mode === "deadline" || mode === "both";
  const hasPeriod = mode === "period" || mode === "both";

  const deadlineAt = hasDeadline ? requiredDate(fd.get("deadlineAt"), "วันกำหนดส่ง") : null;
  const deadlineLabel = hasDeadline ? String(fd.get("deadlineLabel") ?? "").trim() || "กำหนดส่ง" : null;
  if (deadlineLabel && deadlineLabel.length > 40) throw new Error("ชื่อวันที่สำคัญต้องไม่เกิน 40 ตัวอักษร");

  const eventStart = hasPeriod ? parseBangkokDateTime(fd.get("eventStart")) : null;
  const eventEnd = hasPeriod ? parseBangkokDateTime(fd.get("eventEnd")) : null;
  if (hasPeriod && !eventStart) throw new Error("กรุณาระบุวันเริ่มเหตุการณ์");
  validateDateOrder(eventStart, eventEnd);
  const eventLabel = hasPeriod ? String(fd.get("eventLabel") ?? "").trim() || "ช่วงเหตุการณ์" : null;
  if (eventLabel && eventLabel.length > 40) throw new Error("ชื่อช่วงเหตุการณ์ต้องไม่เกิน 40 ตัวอักษร");

  const policy = String(fd.get("archivePolicy") ?? "AUTO");
  if (!["AUTO", "CUSTOM", "NEVER"].includes(policy)) throw new Error("การเก็บเข้าคลังไม่ถูกต้อง");
  const archivePolicy = policy as ArchivePolicy;
  const expiresAt = archivePolicy === "NEVER" ? null
    : archivePolicy === "CUSTOM" ? requiredDate(fd.get("expiresAt"), "วันเก็บเข้าคลัง")
    : hasPeriod && eventStart ? endOfBangkokDay(eventEnd ?? eventStart)
    : deadlineAt;

  return { deadlineAt, deadlineLabel, eventStart, eventEnd, eventLabel, archivePolicy, expiresAt };
}

type DateLike = Date | string | null | undefined;
export type DateDisplayInput = {
  deadlineAt?: DateLike;
  deadlineLabel?: string | null;
  eventStart?: DateLike;
  eventEnd?: DateLike;
  eventLabel?: string | null;
  expiresAt?: DateLike;
};

const TIME_ZONE = "Asia/Bangkok";
const bangkokDateParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const bangkokShortDate = new Intl.DateTimeFormat("th-TH", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "2-digit",
});
const bangkokShortDateWithoutYear = new Intl.DateTimeFormat("th-TH", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
});

function asDate(value: DateLike): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function bangkokCalendarDay(date: Date) {
  const parts = bangkokDateParts.formatToParts(date);
  const partValue = (key: string) => Number(parts.find((part) => part.type === key)?.value ?? 0);
  return { year: partValue("year"), month: partValue("month"), day: partValue("day") };
}

function formatDate(date: Date, withYear = true): string {
  return (withYear ? bangkokShortDate : bangkokShortDateWithoutYear).format(date);
}

function formatDateRange(start: Date, end: Date | null): string {
  if (!end) return formatDate(start);
  const first = bangkokCalendarDay(start);
  const last = bangkokCalendarDay(end);
  if (first.year === last.year && first.month === last.month && first.day === last.day) {
    return formatDate(start);
  }
  if (first.year === last.year && first.month === last.month) {
    return `${first.day}–${formatDate(end)}`;
  }
  return `${formatDate(start, false)} – ${formatDate(end)}`;
}

export function importantDate(input: DateDisplayInput): { label: string; text: string } | null {
  const deadline = asDate(input.deadlineAt);
  if (deadline) return { label: input.deadlineLabel?.trim() || "กำหนดส่ง", text: formatDate(deadline) };
  const start = asDate(input.eventStart);
  if (start) {
    return {
      label: input.eventLabel?.trim() || "ช่วงเหตุการณ์",
      text: formatDateRange(start, asDate(input.eventEnd)),
    };
  }
  return null;
}
