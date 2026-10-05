import type {
  Audience,
  ItemStatus,
  ItemType,
  Prisma,
  Role,
} from "@prisma/client";

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

export function canReadItem(
  item: { status: ItemStatus | string; visibility: string },
  signedIn: boolean
): boolean {
  if (item.status === "DRAFT" || item.status === "HIDDEN") return false;
  if (item.visibility === "KU_ONLY" && !signedIn) return false;
  return item.status === "PUBLISHED" || item.status === "PAST";
}

export function canEditItem(
  user: { id: string; role: Role | string },
  item: { authorId: string }
): boolean {
  if (user.role === "ADMIN") return true;
  return user.role === "EDITOR" && user.id === item.authorId;
}

export function isPast(
  item: { status: ItemStatus | string; expiresAt: Date | null },
  now: Date = new Date()
): boolean {
  if (item.status === "PAST") return true;
  if (item.status !== "PUBLISHED") return false;
  return !!item.expiresAt && item.expiresAt < now;
}

export function daysLeft(expiresAt: Date | null, now: Date = new Date()): number | null {
  if (!expiresAt) return null;
  return Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000);
}

export function audienceMatches(
  audience: Audience | string,
  program?: "CPE" | "SKE" | null
): boolean {
  if (audience === "ALL") return true;
  if (!program) return false;
  if (audience === "CPE_SKE") return program === "CPE" || program === "SKE";
  return audience === program;
}

export function relevantDate(item: {
  type: ItemType | string;
  eventStart: Date | null;
  expiresAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
}): Date {
  if (item.type === "ACTIVITY" && item.eventStart) return item.eventStart;
  if (item.type === "OPPORTUNITY" && item.expiresAt) return item.expiresAt;
  return item.publishedAt ?? item.createdAt;
}

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

export const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "ทุกคน",
  CPE: "CPE",
  SKE: "SKE",
  CPE_SKE: "CPE & SKE",
};

export const TYPE_FIELDS: Record<string, { key: string; label: string }[]> = {
  ACTIVITY: [
    { key: "note", label: "รายละเอียดเพิ่มเติม" },
  ],
  OPPORTUNITY: [
    { key: "qualification", label: "คุณสมบัติ" },
    { key: "reward", label: "สิทธิประโยชน์ / รางวัล" },
  ],
  ALERT: [{ key: "note", label: "สิ่งที่ต้องทำ" }],
  NEWS: [{ key: "detail", label: "รายละเอียดเพิ่มเติม" }],
  DOCUMENT: [{ key: "kind", label: "ประเภทเอกสาร" }],
};
