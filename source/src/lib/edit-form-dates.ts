import type { ContentItem } from "@prisma/client";

type DateFields = Pick<ContentItem,
  "deadlineAt" | "deadlineLabel" | "eventStart" | "eventEnd" | "eventLabel" | "archivePolicy" | "expiresAt"
>;

const bangkokDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function formatBangkokDate(value: Date | null): string {
  if (!value) return "";
  const parts = bangkokDateTime.formatToParts(value);
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatBangkokDateTime(value: Date | null): string {
  if (!value) return "";
  const parts = bangkokDateTime.formatToParts(value);
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

/** Populate every persisted smart-date field when editing to prevent silent data loss. */
export function itemDateFormValues(item: DateFields) {
  return {
    deadlineAt: formatBangkokDate(item.deadlineAt),
    deadlineLabel: item.deadlineLabel ?? "",
    eventStart: formatBangkokDateTime(item.eventStart),
    eventEnd: formatBangkokDateTime(item.eventEnd),
    eventLabel: item.eventLabel ?? "",
    archivePolicy: item.archivePolicy,
    expiresAt: formatBangkokDate(item.expiresAt),
  };
}
