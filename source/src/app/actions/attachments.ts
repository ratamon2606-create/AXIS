"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { canEditItem } from "@/lib/items";
import { writeAudit } from "@/lib/audit";
import { checkFile, makeStorageKey, putObject, deleteObject } from "@/lib/s3";

export async function uploadAttachment(formData: FormData) {
  const user = await requireEditor();
  const itemId = String(formData.get("itemId"));
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("ยังไม่ได้เลือกไฟล์");

  const problem = checkFile({ size: file.size, type: file.type });
  if (problem) throw new Error(problem);

  const item = await db.contentItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("ไม่พบประกาศนี้");
  if (!canEditItem(user, item)) throw new Error("แก้ไขได้เฉพาะประกาศของตัวเอง");

  const key = makeStorageKey(itemId, file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
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
        detail: `แนบไฟล์ ${file.name}`,
      });
    });
  } catch (error) {
    await deleteObject(key).catch(() => {});
    throw error;
  }

  revalidatePath(`/items/${itemId}`);
}

export async function removeAttachment(formData: FormData) {
  const user = await requireEditor();
  const id = String(formData.get("attachmentId"));

  const attachment = await db.attachment.findUnique({
    where: { id },
    include: { item: true },
  });
  if (!attachment) throw new Error("ไม่พบไฟล์นี้");
  if (!canEditItem(user, attachment.item)) throw new Error("แก้ไขได้เฉพาะประกาศของตัวเอง");

  await db.$transaction(async (tx) => {
    await tx.attachment.delete({ where: { id } });
    await writeAudit(tx, {
      actorId: user.id,
      itemId: attachment.itemId,
      action: "DETACH",
      detail: `ลบไฟล์แนบ ${attachment.fileName}`,
    });
  });

  await deleteObject(attachment.storageKey).catch(() => {});
  revalidatePath(`/items/${attachment.itemId}`);
}
