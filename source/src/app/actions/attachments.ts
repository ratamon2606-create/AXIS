"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { canEditItem } from "@/lib/items";
import { writeAudit } from "@/lib/audit";
import { deleteObject } from "@/lib/s3";
import { requireNoMultipartFiles, verifyDirectUploads } from "@/lib/direct-uploads";
import { withPromotedUploads } from "@/lib/upload-transaction";
import { resolveCoverAttachmentId } from "@/lib/cover-image";

export async function uploadAttachment(formData: FormData) {
  const user = await requireEditor();
  const itemId = String(formData.get("itemId") ?? "");
  requireNoMultipartFiles(formData, "file");
  const uploads = await verifyDirectUploads(formData.get("directUploads"), user.id, 1);
  if (uploads.length !== 1) throw new Error("ยังไม่ได้เลือกไฟล์");
  const item = await db.contentItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("ไม่พบประกาศนี้");
  if (!canEditItem(user, item) || item.status === "HIDDEN") throw new Error("ไม่มีสิทธิ์แก้ไขไฟล์ของประกาศนี้");
  await withPromotedUploads(uploads, itemId, async (promoted) => {
    await db.$transaction(async (tx) => {
      await tx.attachment.create({ data: { itemId, ...promoted[0] } });
      await writeAudit(tx, {
        actorId: user.id,
        itemId,
        action: "ATTACH",
        detail: `แนบไฟล์ ${promoted[0].fileName}`,
      });
    });
  });
  revalidatePath(`/items/${itemId}`);
}

export async function removeAttachment(formData: FormData) {
  const user = await requireEditor();
  const id = String(formData.get("attachmentId") ?? "");
  const attachment = await db.attachment.findUnique({ where: { id }, include: { item: true } });
  if (!attachment) throw new Error("ไม่พบไฟล์นี้");
  if (!canEditItem(user, attachment.item) || attachment.item.status === "HIDDEN") throw new Error("ไม่มีสิทธิ์ลบไฟล์ของประกาศนี้");
  if (attachment.item.parentId) {
    const parent = await db.contentItem.findUnique({ where: { id: attachment.item.parentId }, select: { status: true } });
    if (!parent || parent.status === "HIDDEN" || parent.status === "DRAFT") throw new Error("ไม่สามารถลบไฟล์ของประกาศที่ถูกซ่อนได้");
  }
  await db.$transaction(async (tx) => {
    await tx.attachment.delete({ where: { id } });
    if (attachment.item.coverAttachmentId === id) {
      const remaining = await tx.attachment.findMany({
        where: { itemId: attachment.itemId, mimeType: { startsWith: "image/" } },
        select: { id: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      });
      await tx.contentItem.update({
        where: { id: attachment.itemId },
        data: { coverAttachmentId: resolveCoverAttachmentId(remaining, null) },
      });
    }
    await writeAudit(tx, { actorId: user.id, itemId: attachment.itemId, action: "DETACH", detail: `ลบไฟล์แนบ ${attachment.fileName}` });
  });
  // Failed deletion leaves an orphan object, not a broken attachment entry.
  await deleteObject(attachment.storageKey).catch((err) => console.error("Object cleanup failed", err));
  revalidatePath(`/items/${attachment.itemId}`);
  revalidatePath("/announcements");
  if (attachment.item.parentId) revalidatePath(`/items/${attachment.item.parentId}`);
}

/** A cover must be an image attached to this main announcement. */
export async function setCoverImage(formData: FormData) {
  const user = await requireEditor();
  const itemId = String(formData.get("itemId") ?? "");
  const attachmentId = String(formData.get("attachmentId") ?? "");
  if (!itemId || !attachmentId) throw new Error("กรุณาเลือกรูปหน้าปก");
  await db.$transaction(async (tx) => {
    const item = await tx.contentItem.findUnique({ where: { id: itemId } });
    if (!item || item.parentId || item.status === "HIDDEN" || !canEditItem(user, item)) {
      throw new Error("ไม่มีสิทธิ์เปลี่ยนรูปหน้าปก");
    }
    const image = await tx.attachment.findFirst({
      where: { id: attachmentId, itemId, mimeType: { startsWith: "image/" } },
      select: { id: true },
    });
    if (!image) throw new Error("รูปนี้ไม่ได้อยู่ในประกาศ");
    await tx.contentItem.update({ where: { id: itemId }, data: { coverAttachmentId: image.id } });
    await writeAudit(tx, { actorId: user.id, itemId, action: "UPDATE", detail: "เปลี่ยนรูปหน้าปก" });
  });
  revalidatePath("/announcements");
  revalidatePath("/search");
  revalidatePath("/saved");
  revalidatePath("/past");
  revalidatePath("/items/" + itemId);
}
