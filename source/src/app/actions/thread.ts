"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireItemOwner } from "@/lib/ownership";
import { writeAudit } from "@/lib/audit";
import { checkFile, deleteObject, makeStorageKey, putObject } from "@/lib/s3";

const UPDATE_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPDATE_IMAGES = 4;

export async function addFollowUp(parentId: string, formData: FormData) {
  const { user, item: parent } = await requireItemOwner(parentId);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title || !body) throw new Error("ต้องกรอกหัวข้อและรายละเอียด");

  const images = formData
    .getAll("images")
    .filter((value): value is File => typeof value !== "string" && value.size > 0);

  if (images.length > MAX_UPDATE_IMAGES) {
    throw new Error(`แนบรูปในอัปเดตได้สูงสุด ${MAX_UPDATE_IMAGES} รูป`);
  }

  for (const image of images) {
    if (!UPDATE_IMAGE_MIME.has(image.type)) {
      throw new Error("รูปอัปเดตรองรับเฉพาะ JPG, PNG และ WebP");
    }

    const problem = checkFile({ size: image.size, type: image.type });
    if (problem) throw new Error(problem);
  }

  const childId = randomUUID();
  const uploaded: Array<{
    fileName: string;
    mimeType: string;
    size: number;
    storageKey: string;
  }> = [];

  try {
    for (const image of images) {
      const storageKey = makeStorageKey(childId, image.name);
      const buffer = Buffer.from(await image.arrayBuffer());
      await putObject(storageKey, buffer, image.type);

      uploaded.push({
        fileName: image.name,
        mimeType: image.type,
        size: image.size,
        storageKey,
      });
    }

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
            create: uploaded.map((image) => ({
              fileName: image.fileName,
              mimeType: image.mimeType,
              size: image.size,
              storageKey: image.storageKey,
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

      for (const image of uploaded) {
        await writeAudit(tx, {
          actorId: user.id,
          itemId: child.id,
          action: "ATTACH",
          detail: `แนบรูป ${image.fileName}`,
        });
      }
    });
  } catch (error) {
    await Promise.all(uploaded.map((image) => deleteObject(image.storageKey).catch(() => {})));
    throw error;
  }

  revalidatePath(`/items/${parentId}`);
}
