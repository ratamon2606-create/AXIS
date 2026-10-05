"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { canEditItem, TYPE_FIELDS } from "@/lib/items";
import { writeAudit } from "@/lib/audit";
import { checkFile, makeStorageKey, putObject, deleteObject } from "@/lib/s3";
import type { Audience, ItemStatus, ItemType, Visibility } from "@prisma/client";

function readDetails(type: ItemType, formData: FormData) {
  const out: Record<string, string> = {};
  for (const field of TYPE_FIELDS[type] ?? []) {
    const value = String(formData.get(`d_${field.key}`) ?? "").trim();
    if (value) out[field.key] = value;
  }
  return out;
}

function parseBangkokDate(value: FormDataEntryValue | null): Date | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(`${text}T23:59:59+07:00`);
  if (Number.isNaN(date.getTime())) throw new Error("วันที่ไม่ถูกต้อง");
  return date;
}

function parseBangkokDateTime(value: FormDataEntryValue | null): Date | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(`${text}:00+07:00`);
  if (Number.isNaN(date.getTime())) throw new Error("วันเวลาไม่ถูกต้อง");
  return date;
}

function parseYear(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const year = Number(text);
  if (!Number.isInteger(year) || year < 1 || year > 8) throw new Error("ชั้นปีไม่ถูกต้อง");
  return year;
}

function validate(formData: FormData) {
  const missing: string[] = [];
  if (!String(formData.get("title") ?? "").trim()) missing.push("หัวข้อ");
  if (!String(formData.get("body") ?? "").trim()) missing.push("เนื้อหา");


  const audience = String(formData.get("audience") ?? "");
  if (!["ALL", "CPE", "SKE", "CPE_SKE"].includes(audience)) missing.push("กลุ่มเป้าหมาย");

  if (missing.length) throw new Error(`ยังไม่ได้กรอก: ${missing.join(", ")}`);
}

async function uploadFiles(itemId: string, actorId: string, formData: FormData) {
  const files = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0);

  for (const file of files) {
    const problem = checkFile({ size: file.size, type: file.type });
    if (problem) throw new Error(`${file.name}: ${problem}`);

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
          actorId,
          itemId,
          action: "ATTACH",
          detail: `แนบไฟล์ ${file.name}`,
        });
      });
    } catch (error) {
      await deleteObject(key).catch(() => {});
      throw error;
    }
  }
}

export async function createItem(formData: FormData) {
  const user = await requireEditor();
  validate(formData);

  const type = String(formData.get("type") ?? "NEWS") as ItemType;
  const status = String(formData.get("status") ?? "DRAFT") as ItemStatus;
  if (status !== "DRAFT" && status !== "PUBLISHED") throw new Error("สถานะไม่ถูกต้อง");

  const item = await db.$transaction(async (tx) => {
    const created = await tx.contentItem.create({
      data: {
        title: String(formData.get("title") ?? "").trim(),
        body: String(formData.get("body") ?? "").trim(),
        type,
        audience: String(formData.get("audience")) as Audience,
        targetYear: parseYear(formData.get("targetYear")),
        visibility: String(formData.get("visibility") ?? "KU_ONLY") as Visibility,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        eventStart: parseBangkokDateTime(formData.get("eventStart")),
        eventEnd: parseBangkokDateTime(formData.get("eventEnd")),
        expiresAt: parseBangkokDate(formData.get("expiresAt")),
        location: String(formData.get("location") ?? "").trim() || null,
        details: readDetails(type, formData),
        authorId: user.id,
      },
    });

    await writeAudit(tx, {
      actorId: user.id,
      itemId: created.id,
      action: status === "PUBLISHED" ? "PUBLISH" : "CREATE",
    });

    return created;
  });

  try {
    await uploadFiles(item.id, user.id, formData);
  } catch (error) {
    await db.contentItem.delete({ where: { id: item.id } }).catch(() => {});
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/announcements");
  revalidatePath("/search");
  revalidatePath("/calendar");
  redirect(`/items/${item.id}`);
}

export async function updateItem(formData: FormData) {
  const user = await requireEditor();
  validate(formData);

  const id = String(formData.get("id") ?? "");
  const existing = await db.contentItem.findUnique({ where: { id } });
  if (!existing) throw new Error("ไม่พบประกาศนี้");
  if (!canEditItem(user, existing)) throw new Error("แก้ไขได้เฉพาะประกาศของตัวเอง");
  if (existing.status === "HIDDEN") throw new Error("ประกาศที่ซ่อนถาวรแก้ไขไม่ได้");

  const type = String(formData.get("type") ?? "NEWS") as ItemType;
  const requestedStatus = String(formData.get("status") ?? existing.status);
  let nextStatus = existing.status;

  if (existing.status === "DRAFT") {
    if (requestedStatus !== "DRAFT" && requestedStatus !== "PUBLISHED") {
      throw new Error("สถานะไม่ถูกต้อง");
    }
    nextStatus = requestedStatus as "DRAFT" | "PUBLISHED";
  }

  await db.$transaction(async (tx) => {
    await tx.contentItem.update({
      where: { id },
      data: {
        title: String(formData.get("title") ?? "").trim(),
        body: String(formData.get("body") ?? "").trim(),
        type,
        audience: String(formData.get("audience")) as Audience,
        targetYear: parseYear(formData.get("targetYear")),
        visibility: String(formData.get("visibility") ?? "KU_ONLY") as Visibility,
        status: nextStatus,
        publishedAt:
          existing.publishedAt ?? (nextStatus === "PUBLISHED" ? new Date() : null),
        eventStart: parseBangkokDateTime(formData.get("eventStart")),
        eventEnd: parseBangkokDateTime(formData.get("eventEnd")),
        expiresAt: parseBangkokDate(formData.get("expiresAt")),
        location: String(formData.get("location") ?? "").trim() || null,
        details: readDetails(type, formData),
      },
    });

    await writeAudit(tx, {
      actorId: user.id,
      itemId: id,
      action: existing.status === "DRAFT" && nextStatus === "PUBLISHED" ? "PUBLISH" : "UPDATE",
    });
  });

  await uploadFiles(id, user.id, formData);

  revalidatePath("/");
  revalidatePath("/announcements");
  revalidatePath("/search");
  revalidatePath("/calendar");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}
