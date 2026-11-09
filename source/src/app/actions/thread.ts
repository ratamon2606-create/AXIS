"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireItemOwner } from "@/lib/ownership";
import { writeAudit } from "@/lib/audit";
import { requireNoMultipartFiles, verifyDirectUploads } from "@/lib/direct-uploads";
import { withPromotedUploads } from "@/lib/upload-transaction";
import {
  assertEditableFollowUp,
  assertFollowUpImageCount,
  FOLLOW_UP_IMAGE_TYPES,
  MAX_FOLLOW_UP_IMAGES,
  readFollowUpFields,
} from "@/lib/follow-ups";

async function readFollowUpUploads(formData: FormData, userId: string) {
  requireNoMultipartFiles(formData, "images");
  const uploads = await verifyDirectUploads(
    formData.get("directUploads"),
    userId,
    MAX_FOLLOW_UP_IMAGES,
  );
  if (uploads.some((image) => !FOLLOW_UP_IMAGE_TYPES.has(image.mimeType))) {
    throw new Error("รูปอัปเดตรองรับเฉพาะ JPG, PNG และ WebP");
  }
  return uploads;
}

export async function addFollowUp(parentId: string, formData: FormData) {
  const { user, item: parent } = await requireItemOwner(parentId);
  if (parent.parentId || parent.status !== "PUBLISHED") {
    throw new Error("เพิ่มอัปเดตได้เฉพาะประกาศหลักที่เผยแพร่อยู่");
  }

  const { title, body } = readFollowUpFields(formData);
  const uploads = await readFollowUpUploads(formData, user.id);
  const childId = randomUUID();

  await withPromotedUploads(uploads, childId, async (promoted) => {
    await db.$transaction(async (tx) => {
      const child = await tx.contentItem.create({
        data: {
          id: childId,
          title,
          body,
          type: parent.type,
          audience: parent.audience,
          targetYear: parent.targetYear,
          visibility: parent.visibility,
          status: "PUBLISHED",
          publishedAt: new Date(),
          authorId: user.id,
          parentId: parent.id,
          attachments: {
            create: promoted.map(({ fileName, mimeType, size, storageKey }) => ({
              fileName,
              mimeType,
              size,
              storageKey,
            })),
          },
        },
      });

      await writeAudit(tx, {
        actorId: user.id,
        itemId: child.id,
        action: "CREATE",
        detail: `อัปเดตของ ${parent.title}`,
      });
      for (const image of uploads) {
        await writeAudit(tx, {
          actorId: user.id,
          itemId: child.id,
          action: "ATTACH",
          detail: `แนบรูป ${image.fileName}`,
        });
      }
    });
  });

  revalidatePath(`/items/${parentId}`);
  revalidatePath("/");
  revalidatePath("/search");
}

export async function editFollowUp(followUpId: string, formData: FormData) {
  const { user, item } = await requireItemOwner(followUpId);
  const parent = item.parentId
    ? await db.contentItem.findUnique({
        where: { id: item.parentId },
        select: { id: true, parentId: true, status: true },
      })
    : null;
  assertEditableFollowUp(item, parent);

  const { title, body } = readFollowUpFields(formData);
  const uploads = await readFollowUpUploads(formData, user.id);
  const existingImageCount = await db.attachment.count({
    where: { itemId: item.id, mimeType: { in: [...FOLLOW_UP_IMAGE_TYPES] } },
  });
  assertFollowUpImageCount(existingImageCount, uploads.length);
  if (title === item.title && body === item.body && uploads.length === 0) return;

  await withPromotedUploads(uploads, item.id, async (promoted) => {
    await db.$transaction(async (tx) => {
      // Recheck within the transaction to avoid editing a hidden parent.
      const current = await tx.contentItem.findUnique({
        where: { id: item.id },
        select: { parentId: true, status: true },
      });
      const currentParent = current?.parentId
        ? await tx.contentItem.findUnique({
            where: { id: current.parentId },
            select: { id: true, parentId: true, status: true },
          })
        : null;
      if (!current) throw new Error("ไม่พบอัปเดตนี้");
      assertEditableFollowUp(current, currentParent);

      const currentImages = await tx.attachment.count({
        where: { itemId: item.id, mimeType: { in: [...FOLLOW_UP_IMAGE_TYPES] } },
      });
      assertFollowUpImageCount(currentImages, promoted.length);

      await tx.contentItem.update({ where: { id: item.id }, data: { title, body } });
      for (const image of promoted) {
        await tx.attachment.create({
          data: {
            itemId: item.id,
            fileName: image.fileName,
            mimeType: image.mimeType,
            size: image.size,
            storageKey: image.storageKey,
          },
        });
        await writeAudit(tx, {
          actorId: user.id,
          itemId: item.id,
          action: "ATTACH",
          detail: `เพิ่มรูปในอัปเดต ${image.fileName}`,
        });
      }
      await writeAudit(tx, {
        actorId: user.id,
        itemId: item.id,
        action: "UPDATE",
        detail: "แก้ไขหัวข้อ/เนื้อหา/รูปของอัปเดต",
      });
    });
  });

  revalidatePath(`/items/${item.parentId}`);
  revalidatePath(`/items/${item.id}`);
}
