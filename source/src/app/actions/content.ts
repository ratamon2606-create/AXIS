"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import type { ItemStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { canEditItem } from "@/lib/items";
import { writeAudit } from "@/lib/audit";
import { parseContentForm } from "@/lib/content-form";
import { requireNoMultipartFiles, verifyDirectUploads } from "@/lib/direct-uploads";
import { withPromotedUploads } from "@/lib/upload-transaction";
import { revalidateContent } from "@/lib/revalidate-content";

export async function createItem(formData: FormData) {
  const user = await requireEditor();
  const content = parseContentForm(formData);
  requireNoMultipartFiles(formData, "attachments");
  const uploads = await verifyDirectUploads(formData.get("directUploads"), user.id);

  const status = String(formData.get("status") ?? "DRAFT") as ItemStatus;
  if (status !== "DRAFT" && status !== "PUBLISHED") {
    throw new Error("สถานะไม่ถูกต้อง");
  }

  const itemId = randomUUID();
  const item = await withPromotedUploads(uploads, itemId, async (promoted) => {
    return db.$transaction(async (tx) => {
      const created = await tx.contentItem.create({
        data: {
          id: itemId,
          ...content,
          status,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
          authorId: user.id,
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
        itemId: created.id,
        action: status === "PUBLISHED" ? "PUBLISH" : "CREATE",
      });
      for (const upload of uploads) {
        await writeAudit(tx, {
          actorId: user.id,
          itemId: created.id,
          action: "ATTACH",
          detail: `แนบไฟล์ ${upload.fileName}`,
        });
      }
      return created;
    });
  });

  revalidateContent(item.id);
  redirect(`/items/${item.id}`);
}

export async function updateItem(formData: FormData) {
  const user = await requireEditor();
  const content = parseContentForm(formData);
  requireNoMultipartFiles(formData, "attachments");
  const uploads = await verifyDirectUploads(formData.get("directUploads"), user.id);

  const id = String(formData.get("id") ?? "");
  const existing = await db.contentItem.findUnique({ where: { id } });
  if (!existing) throw new Error("ไม่พบประกาศนี้");
  if (!canEditItem(user, existing)) throw new Error("แก้ไขได้เฉพาะประกาศของตัวเอง");
  if (existing.status === "HIDDEN") throw new Error("ประกาศที่ซ่อนถาวรแก้ไขไม่ได้");
  if (existing.parentId) throw new Error("กรุณาแก้ไขประกาศหลักแทน");

  const requestedStatus = String(formData.get("status") ?? existing.status);
  let nextStatus = existing.status;
  if (existing.status === "DRAFT") {
    if (requestedStatus !== "DRAFT" && requestedStatus !== "PUBLISHED") {
      throw new Error("สถานะไม่ถูกต้อง");
    }
    nextStatus = requestedStatus;
  }

  await withPromotedUploads(uploads, id, async (promoted) => {
    await db.$transaction(async (tx) => {
      await tx.contentItem.update({
        where: { id },
        data: {
          ...content,
          status: nextStatus,
          publishedAt: existing.publishedAt ?? (nextStatus === "PUBLISHED" ? new Date() : null),
        },
      });

      await writeAudit(tx, {
        actorId: user.id,
        itemId: id,
        action: existing.status === "DRAFT" && nextStatus === "PUBLISHED" ? "PUBLISH" : "UPDATE",
      });

      await tx.contentItem.updateMany({
        where: { parentId: id },
        data: {
          visibility: content.visibility,
          audience: content.audience,
          targetYear: content.targetYear,
        },
      });

      for (const upload of promoted) {
        await tx.attachment.create({ data: { itemId: id, ...upload } });
        await writeAudit(tx, {
          actorId: user.id,
          itemId: id,
          action: "ATTACH",
          detail: `แนบไฟล์ ${upload.fileName}`,
        });
      }
    });
  });

  revalidateContent(id);
  redirect(`/items/${id}`);
}
