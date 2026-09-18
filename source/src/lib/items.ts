import type { Prisma, ItemStatus } from "@prisma/client";

/**
 * กฎการมองเห็น รวมไว้ที่เดียว ทุกหน้าต้องเรียกผ่านฟังก์ชันนี้
 *
 * iteration 2 เพิ่มพารามิเตอร์ scope เพื่อรองรับวงจรหมดเขต
 * โดยที่กฎเดิมยังอยู่ครบและเรียกแบบเดิมได้ หน้าที่เขียนไว้แล้วจึงไม่ต้องแก้
 *
 * SRS-1   ฟีดแสดงเฉพาะที่เผยแพร่แล้ว ยังไม่หมดเขต และไม่ถูกซ่อน
 * SRS-5   ของที่จบแล้วยังค้นหาเจอเมื่อผู้ใช้ขอ
 * SRS-8   ผู้ที่ไม่มี session ไม่เห็นรายการที่จำกัด
 * SRS-18  พ้นวันหมดเขตแล้วออกจากฟีดปัจจุบัน
 * SRS-20  ของที่ซ่อนถาวรไม่ปรากฏต่อผู้อ่านในทุก scope
 * SRS-26  รายการที่ไม่มีวันหมดเขตไม่จบเองโดยเวลา
 */

export type Scope = "current" | "past" | "all";

export function visibleWhere(
  signedIn: boolean,
  scope: Scope = "current",
  now: Date = new Date()
): Prisma.ContentItemWhereInput {
  const base: Prisma.ContentItemWhereInput = {
    parentId: null,
    ...(signedIn ? {} : { visibility: "PUBLIC" }),
  };

  const current: Prisma.ContentItemWhereInput = {
    status: "PUBLISHED",
    OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
  };

  const past: Prisma.ContentItemWhereInput = {
    OR: [
      { status: "PAST" },
      { status: "PUBLISHED", expiresAt: { lt: now } },
    ],
  };

  if (scope === "current") return { ...base, ...current };
  if (scope === "past") return { ...base, ...past };
  return { ...base, OR: [current, past] };
}

/**
 * กฎของโพสต์ต่อในเธรด
 * โพสต์ต่อเป็น ContentItem จริง จึงต้องกรอง draft/hidden และ visibility เช่นเดียวกับ parent
 * relation ของ Prisma จำกัด parent ให้อยู่แล้ว จึงไม่ต้องใส่ parentId ในเงื่อนไขนี้
 */
export function threadChildWhere(
  signedIn: boolean
): Prisma.ContentItemWhereInput {
  return {
    status: { in: ["PUBLISHED", "PAST"] },
    ...(signedIn ? {} : { visibility: "PUBLIC" }),
  };
}

/**
 * แปลงค่าจาก <input type="date"> ให้หมดเขตตอนสิ้นวันตามเวลาไทย
 * เช่น 2026-09-20 หมายถึงยังใช้งานได้ตลอดวันที่ 20 กันยายน
 */
export function parseBangkokEndOfDay(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error("รูปแบบวันหมดเขตไม่ถูกต้อง");
  }

  const parsed = new Date(`${trimmed}T23:59:59.999+07:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("วันหมดเขตไม่ถูกต้อง");
  }
  return parsed;
}

/**
 * ใช้ตัดสินรายการเดี่ยว เช่นในหน้ารายละเอียด ที่ query ไม่ได้ช่วยตัดสินให้
 * แยกออกมาเป็นฟังก์ชันล้วนเพื่อให้เขียน unit test ได้โดยไม่ต้องต่อฐานข้อมูล
 */
export function isPast(
  item: { status: ItemStatus | string; expiresAt: Date | null },
  now: Date = new Date()
): boolean {
  if (item.status === "PAST") return true;
  if (item.status !== "PUBLISHED") return false;
  return !!item.expiresAt && item.expiresAt < now;
}

/** จำนวนวันที่เหลือ คืน null เมื่อไม่มีวันหมดเขต ใช้แสดงป้ายบนการ์ด */
export function daysLeft(expiresAt: Date | null, now: Date = new Date()): number | null {
  if (!expiresAt) return null;
  return Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000);
}

/** ลำดับการแสดงผล ปักหมุดขึ้นก่อนเสมอ แล้วจึงเรียงตามวันที่ (SRS-2) */
export const feedOrder: Prisma.ContentItemOrderByWithRelationInput[] = [
  { pinned: "desc" },
  { createdAt: "desc" },
];

export const TYPE_LABEL: Record<string, string> = {
  NEWS: "ข่าวสาร",
  OPPORTUNITY: "โอกาส",
  ACTIVITY: "กิจกรรม",
  ALERT: "แจ้งเตือน",
  DOCUMENT: "เอกสาร",
};

export const TYPE_FIELDS: Record<string, { key: string; label: string }[]> = {
  ACTIVITY: [
    { key: "when", label: "วันเวลา" },
    { key: "where", label: "สถานที่" },
    { key: "who", label: "กลุ่มเป้าหมาย" },
  ],
  OPPORTUNITY: [
    { key: "deadline", label: "วันปิดรับ" },
    { key: "qualification", label: "คุณสมบัติ" },
    { key: "reward", label: "รางวัล" },
  ],
  ALERT: [
    { key: "when", label: "ช่วงเวลา" },
    { key: "where", label: "พื้นที่" },
    { key: "note", label: "สิ่งที่ต้องทำ" },
  ],
  NEWS: [
    { key: "effective", label: "วันที่มีผล" },
    { key: "detail", label: "รายละเอียด" },
  ],
  DOCUMENT: [{ key: "kind", label: "ประเภท" }],
};
