import type { Prisma } from "@prisma/client";

export function visibleWhere(signedIn: boolean): Prisma.ContentItemWhereInput {
  return {
    status: "PUBLISHED",
    parentId: null,
    ...(signedIn ? {} : { visibility: "PUBLIC" }),
  };
}

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
