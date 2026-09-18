"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

/**
 * วงจรหมดเขต · เจ้าของไฟล์คือ Jehan (US-7)
 *
 * SRS-24 ผู้เขียนกดให้จบก่อนถึงวันได้
 * SRS-19 ต่ออายุแล้วกลับมาอยู่ในฟีด
 * SRS-21 ทุกการเขียนต้องบันทึก และบันทึกต้องเกิดใน transaction เดียวกับการเปลี่ยนแปลง
 *
 * ทั้งสองฟังก์ชันไม่ลบข้อมูล เปลี่ยนเฉพาะสถานะและวันหมดเขต
 * ประวัติในเธรดจึงไม่ขาด ต่างจากการลบแล้วสร้างใหม่
 */

/** กดให้ประกาศจบเลย เช่นกิจกรรมที่เต็มก่อนกำหนด */
export async function markPast(formData: FormData) {
  const user = await requireEditor();
  const id = String(formData.get("id"));

  await db.$transaction(async (tx) => {
    const item = await tx.contentItem.findUnique({ where: { id } });
    if (!item) throw new Error("ไม่พบประกาศนี้");
    if (item.status !== "PUBLISHED") throw new Error("ประกาศนี้ไม่ได้อยู่ในสถานะเผยแพร่");

    await tx.contentItem.update({
      where: { id },
      data: { status: "PAST" },
    });

    await writeAudit(tx, {
      actorId: user.id,
      itemId: id,
      action: "MARK_PAST",
      detail: `ปิดก่อนกำหนด เดิมหมดเขต ${item.expiresAt?.toISOString() ?? "ไม่ระบุ"}`,
    });
  });

  revalidatePath("/");
  revalidatePath("/past");
  redirect(`/items/${id}`);
}

/**
 * ต่ออายุประกาศที่จบแล้ว
 *
 * ต้องคืนสถานะเป็น PUBLISHED ด้วย ไม่ใช่แค่เลื่อนวัน
 * เพราะรายการที่ผู้เขียนกดให้จบเองมีสถานะ PAST ซึ่งการเลื่อนวันอย่างเดียวจะไม่พากลับมา
 */
export async function extendItem(formData: FormData) {
  const user = await requireEditor();
  const id = String(formData.get("id"));
  const days = Number(formData.get("days") ?? 30);

  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error("จำนวนวันที่ต่ออายุต้องอยู่ระหว่าง 1 ถึง 365");
  }

  await db.$transaction(async (tx) => {
    const item = await tx.contentItem.findUnique({ where: { id } });
    if (!item) throw new Error("ไม่พบประกาศนี้");
    if (item.status === "HIDDEN") throw new Error("ประกาศที่ซ่อนถาวรแล้วต่ออายุไม่ได้");

    // นับจากวันนี้เสมอ ไม่ใช่นับต่อจากวันหมดเขตเดิม
    // เพราะถ้าเดิมหมดไปแล้วสามเดือน การนับต่อจะได้วันที่ยังผ่านมาแล้วอยู่ดี
    const next = new Date(Date.now() + days * 86_400_000);

    await tx.contentItem.update({
      where: { id },
      data: { status: "PUBLISHED", expiresAt: next },
    });

    await writeAudit(tx, {
      actorId: user.id,
      itemId: id,
      action: "EXTEND",
      detail: `ต่ออายุ ${days} วัน ถึง ${next.toISOString()}`,
    });
  });

  revalidatePath("/");
  revalidatePath("/past");
  redirect(`/items/${id}`);
}
