import type { CSSProperties } from "react";
export type ShelfItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  audience: string;
  targetYear: number | null;
  eventStart: string | null;
  eventEnd: string | null;
  expiresAt: string | null;
  deadlineAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  location: string | null;
  saved: boolean;
  coverAttachmentId: string | null;
};


const TAN_30 = 0.5773502692;

export function endDate(item: ShelfItem) {
  if (item.deadlineAt) return new Date(item.deadlineAt);
  if (item.eventEnd) return new Date(item.eventEnd);
  if (item.expiresAt) return new Date(item.expiresAt);
  if (item.eventStart) return new Date(item.eventStart);
  return null;
}

export function shortDate(value: Date | null) {
  if (!value) return "ไม่กำหนดวันสิ้นสุด";

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(value);
}

export function fullDate(value: string | null) {
  if (!value) return "ไม่ระบุ";

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
    hour12: false,
  }).format(new Date(value));
}

export function truncate(text: string, max = 380) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trim()}…`;
}

/*
 * Exact isometric row from the reference:
 *
 * x axis of the row: right
 * y axis of the row: up
 * slope: -tan(30deg) = -0.5773502692
 *
 * Every inactive book is on THIS SAME LINE.
 * Only the distance touching the active center slot is enlarged.
 */
export function positionVars(
  offset: number,
  active: boolean,
): CSSProperties {
  if (active) {
    return {
      "--book-x-desktop": "0px",
      "--book-y-desktop": "46px",
      "--book-x-tablet": "0px",
      "--book-y-tablet": "40px",
      "--book-x-mobile": "0px",
      "--book-y-mobile": "34px",
      "--book-scale": "1",
      zIndex: 100,
    } as CSSProperties;
  }

  const direction = offset < 0 ? -1 : 1;
  const distance = Math.abs(offset);

  /*
   * The closest inactive books are far away from the active slot.
   * Books after that use a tight repeated step.
   *
   * IMPORTANT:
   * Y is derived from X using tan(30deg), so all inactive books
   * remain exactly on one -30° isometric row.
   */
  const desktopCenterX = 205;
  const desktopStepX = 66;

  const tabletCenterX = 166;
  const tabletStepX = 54;

  const mobileCenterX = 122;
  const mobileStepX = 40;

  const desktopX =
    direction *
    (desktopCenterX + Math.max(0, distance - 1) * desktopStepX);

  const tabletX =
    direction *
    (tabletCenterX + Math.max(0, distance - 1) * tabletStepX);

  const mobileX =
    direction *
    (mobileCenterX + Math.max(0, distance - 1) * mobileStepX);

  const desktopY = -desktopX * TAN_30;
  const tabletY = -tabletX * TAN_30;
  const mobileY = -mobileX * TAN_30;

  /*
   * Reference books are nearly equal in size.
   * Keep only a very subtle distance reduction.
   */
  const scale = Math.max(
    0.9,
    0.96 - Math.max(0, distance - 1) * 0.015,
  );

  /*
   * Depth order follows the actual isometric row.
   *
   * lower-left  = closer to the viewer = higher layer
   * upper-right = farther away         = lower layer
   *
   * So z-index must be monotonic along offset,
   * not symmetrical by distance from the active book.
   */
  const zIndex = 70 - offset;

  return {
    "--book-x-desktop": `${desktopX}px`,
    "--book-y-desktop": `${desktopY}px`,
    "--book-x-tablet": `${tabletX}px`,
    "--book-y-tablet": `${tabletY}px`,
    "--book-x-mobile": `${mobileX}px`,
    "--book-y-mobile": `${mobileY}px`,
    "--book-scale": String(scale),
    zIndex,
  } as CSSProperties;
}

export function bookTitleSize(title: string) {
  const length = title.trim().length;

  if (length >= 70) {
    return "axis-book-title-xxs";
  }

  if (length >= 50) {
    return "axis-book-title-xs";
  }

  if (length >= 34) {
    return "axis-book-title-sm";
  }

  if (length >= 22) {
    return "axis-book-title-md";
  }

  return "axis-book-title-lg";
}

