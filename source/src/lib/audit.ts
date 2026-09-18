import type { Prisma, AuditAction } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * บันทึกการใช้งาน · เจ้าของไฟล์คือ Piyatida (US-8)
 *
 * SRS-21 บันทึกผู้กระทำ รายการ การกระทำ และเวลา ของทุกการเขียน
 * NFR-8  เก็บอย่างน้อยหนึ่งปีการศึกษา และแก้หรือลบจากหน้าเว็บไม่ได้
 *
 * ฟังก์ชันนี้รับ tx เข้ามาแทนที่จะเรียก db ตรง ๆ เพื่อบังคับให้
 * การบันทึกเกิดใน transaction เดียวกับการเปลี่ยนแปลง
 *
 * เหตุผล ถ้าการเปลี่ยนแปลงสำเร็จแต่การบันทึกล้มเหลว เราจะได้ประวัติที่ไม่ครบ
 * ซึ่งแย่กว่าไม่มีประวัติเลย เพราะคนจะเชื่อว่ามันครบ
 */

type AuditInput = {
  actorId: string;
  action: AuditAction;
  itemId?: string | null;
  detail?: string | null;
};

/** ใช้ภายใน transaction เสมอ */
export async function writeAudit(
  tx: Prisma.TransactionClient,
  input: AuditInput
): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorId: input.actorId,
      itemId: input.itemId ?? null,
      action: input.action,
      detail: input.detail ?? null,
    },
  });
}

/**
 * ใช้เมื่อการกระทำนั้นไม่มีการเปลี่ยนแปลงฐานข้อมูลอื่นให้ผูกด้วย
 * ปกติควรใช้ writeAudit ใน transaction มากกว่า
 */
export async function writeAuditStandalone(input: AuditInput): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: input.actorId,
      itemId: input.itemId ?? null,
      action: input.action,
      detail: input.detail ?? null,
    },
  });
}

/** อ่านบันทึกล่าสุด ใช้ในหน้าผู้ดูแล ไม่มีฟังก์ชันลบหรือแก้โดยตั้งใจ */
export async function recentAudit(take = 100) {
  return db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { email: true, name: true } },
      item: { select: { id: true, title: true } },
    },
  });
}
