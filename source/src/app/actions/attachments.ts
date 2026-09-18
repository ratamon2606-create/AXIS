"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { checkFile, makeStorageKey, putObject, deleteObject } from "@/lib/s3";

/**
 * ไฟล์แนบ · เจ้าของไฟล์คือ Thanakorn (US-6)
 *
 * SRS-13 เขียนได้เฉพาะผู้เขียนและผู้ดูแล
 * NFR-4  ขนาดและชนิดไฟล์ที่รับได้
 * SRS-21 บันทึกการแนบไฟล์ด้วย
 */

export async function uploadAttachment(formData: FormData) {
  const user = await requireEditor();
  const itemId = String(formData.get("itemId"));
  const file = formData.get("file") as File | null;

  if (!file) throw new Error("ยังไม่ได้เลือกไฟล์");

  // ตรวจก่อนอ่านไฟล์เข้าหน่วยความจำ ไฟล์ใหญ่เกินจะได้ไม่กินแรมไปเปล่า ๆ
  const problem = checkFile({ size: file.size, type: file.type });
  if (problem) throw new Error(problem);

  const item = await db.contentItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("ไม่พบประกาศนี้");

  const key = makeStorageKey(itemId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  // เขียนไฟล์ลงที่เก็บก่อน แล้วค่อยบันทึกลงฐานข้อมูล
  // ถ้าสลับลำดับ แล้วการอัปโหลดล้มเหลว จะมีแถวที่ชี้ไปไฟล์ที่ไม่มีอยู่จริง
  await putObject(key, buffer, file.type);

  try {
    await db.$transaction(async (tx) => {
      await tx.attachment.create({
        data: {
          itemId,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          storageKey: key,
        },
      });

      await writeAudit(tx, {
        actorId: user.id,
        itemId,
        action: "ATTACH",
        detail: `แนบไฟล์ ${file.name} ขนาด ${Math.round(file.size / 1024)} KB`,
      });
    });
  } catch (e) {
    // ถ้าบันทึกลงฐานข้อมูลไม่สำเร็จ ให้ลบไฟล์ที่เพิ่งอัปโหลดทิ้ง
    // ไม่งั้นจะมีไฟล์กำพร้าค้างอยู่ในที่เก็บโดยไม่มีใครอ้างถึง
    await deleteObject(key).catch(() => {});
    throw e;
  }

  revalidatePath(`/items/${itemId}`);
}

export async function removeAttachment(formData: FormData) {
  const user = await requireEditor();
  const id = String(formData.get("attachmentId"));

  const attachment = await db.attachment.findUnique({ where: { id } });
  if (!attachment) throw new Error("ไม่พบไฟล์นี้");

  await db.$transaction(async (tx) => {
    await tx.attachment.delete({ where: { id } });
    await writeAudit(tx, {
      actorId: user.id,
      itemId: attachment.itemId,
      action: "UPDATE",
      detail: `ลบไฟล์แนบ ${attachment.fileName}`,
    });
  });

  // ลบแถวก่อนแล้วค่อยลบไฟล์ ถ้าลบไฟล์ไม่สำเร็จจะเหลือไฟล์กำพร้า
  // ซึ่งเสียพื้นที่แต่ไม่ทำให้ระบบผิด ต่างจากการเหลือแถวที่ชี้ไปไฟล์ที่หายไป
  await deleteObject(attachment.storageKey).catch(() => {});

  revalidatePath(`/items/${attachment.itemId}`);
}
