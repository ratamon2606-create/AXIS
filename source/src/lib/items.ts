import type { Prisma } from "@prisma/client";

/**
 * กฎการมองเห็น รวมไว้ที่เดียว ทุกหน้าต้องเรียกผ่านฟังก์ชันนี้
 * หน้าที่เขียนทีหลังจะได้ข้ามกฎไม่ได้โดยบังเอิญ
 *
 * เจ้าของไฟล์นี้คือ C หลังจาก iteration 1 วันแรก
 * D เขียนตัวตั้งต้นไว้ให้ทุกคนเริ่มงานได้พร้อมกัน
 *
 * SRS-1  เห็นเฉพาะที่เผยแพร่แล้ว
 * SRS-8  ผู้ที่ไม่มี session ไม่เห็นรายการที่ตั้งเป็น KU_ONLY
 */
export function visibleWhere(signedIn: boolean): Prisma.ContentItemWhereInput {
  return {
    status: "PUBLISHED",
    parentId: null, // โพสต์ต่อในเธรดไม่ขึ้นในฟีด ขึ้นเฉพาะในหน้าเธรดของโพสต์แม่
    ...(signedIn ? {} : { visibility: "PUBLIC" }),
  };
}

/** ป้ายชื่อประเภทและช่องรายละเอียดของแต่ละประเภท ใช้ร่วมกันทั้งฟอร์มและหน้าแสดงผล */
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
