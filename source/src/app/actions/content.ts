"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { TYPE_FIELDS, parseBangkokEndOfDay } from "@/lib/items";
import { writeAudit } from "@/lib/audit";
import type {
  Department,
  ItemType,
  Visibility,
} from "@prisma/client";

/** เจ้าของไฟล์นี้คือ B (US-5) */
function readDetails(type: ItemType, formData: FormData) {
  const out: Record<string, string> = {};

  for (const f of TYPE_FIELDS[type] ?? []) {
    const v = String(formData.get(`d_${f.key}`) ?? "").trim();
    if (v) out[f.key] = v;
  }

  return out;
}

/**
 * SRS-14 ต้องกรอกข้อมูลที่จำเป็นครบก่อนบันทึก
 * SRS-15 ถ้าไม่ครบต้องไม่บันทึกและบอกว่าขาดช่องไหน
 * ตรวจซ้ำที่ฝั่ง server แม้ฟอร์มจะตรวจให้แล้ว
 */
function validate(formData: FormData) {
  const missing: string[] = [];

  if (!String(formData.get("title") ?? "").trim()) missing.push("หัวข้อ");
  if (!String(formData.get("body") ?? "").trim()) missing.push("เนื้อหา");

  const dept = String(formData.get("department") ?? "");
  if (dept !== "CPE" && dept !== "SKE") missing.push("ภาควิชา");

  if (missing.length) {
    throw new Error(`ยังไม่ได้กรอก: ${missing.join(", ")}`);
  }
}

export async function createItem(formData: FormData) {
  const user = await requireEditor();
  validate(formData);

  const type = String(formData.get("type") ?? "NEWS") as ItemType;
  const publish = formData.get("publish") === "1";
  const expiresAt = parseBangkokEndOfDay(String(formData.get("expiresAt") ?? ""));

  const item = await db.$transaction(async (tx) => {
    const created = await tx.contentItem.create({
      data: {
        title: String(formData.get("title")).trim(),
        body: String(formData.get("body")).trim(),
        type,
        department: String(formData.get("department")) as Department,
        visibility: String(formData.get("visibility") ?? "KU_ONLY") as Visibility,
        status: publish ? "PUBLISHED" : "DRAFT",
        details: readDetails(type, formData),
        expiresAt,
        authorId: user.id,
      },
    });

    await writeAudit(tx, {
      actorId: user.id,
      itemId: created.id,
      action: publish ? "PUBLISH" : "CREATE",
      detail: publish ? "สร้างและเผยแพร่ประกาศ" : "สร้างร่างประกาศ",
    });

    return created;
  });

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/past");
  revalidatePath("/admin");

  // ร่างยังเปิดผ่านหน้ารายละเอียดสาธารณะไม่ได้ จึงพากลับมาหน้าแก้ไขแทน
  redirect(publish ? `/items/${item.id}` : `/admin/${item.id}/edit`);
}

export async function updateItem(formData: FormData) {
  const user = await requireEditor();
  validate(formData);

  const id = String(formData.get("id"));
  const type = String(formData.get("type") ?? "NEWS") as ItemType;
  const publishRequested = formData.get("publish") === "1";
  const expiresAt = parseBangkokEndOfDay(String(formData.get("expiresAt") ?? ""));

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.contentItem.findUnique({ where: { id } });
    if (!existing) throw new Error("ไม่พบประกาศนี้");

    // ปุ่มเผยแพร่มีผลเฉพาะร่าง เพื่อไม่ให้การแก้ PAST/HIDDEN เปลี่ยนสถานะโดยไม่ตั้งใจ
    const publishingDraft = existing.status === "DRAFT" && publishRequested;
    const nextStatus = publishingDraft ? "PUBLISHED" : existing.status;

    await tx.contentItem.update({
      where: { id },
      data: {
        title: String(formData.get("title")).trim(),
        body: String(formData.get("body")).trim(),
        type,
        department: String(formData.get("department")) as Department,
        visibility: String(formData.get("visibility") ?? "KU_ONLY") as Visibility,
        status: nextStatus,
        details: readDetails(type, formData),
        expiresAt,
      },
    });

    await writeAudit(tx, {
      actorId: user.id,
      itemId: id,
      action: publishingDraft ? "PUBLISH" : "UPDATE",
      detail: publishingDraft ? "เผยแพร่ร่างประกาศ" : undefined,
    });

    return { status: nextStatus };
  });

  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/past");
  revalidatePath("/admin");
  revalidatePath(`/items/${id}`);

  redirect(result.status === "DRAFT" ? `/admin/${id}/edit` : `/items/${id}`);
}

/**
 * เพิ่มโพสต์ต่อในเธรดผ่านหน้าเว็บ
 * follow-up สืบทอด type/department/visibility จาก parent เพื่อไม่ให้กฎของเธรดแตกต่างกันเอง
 */
export async function createFollowUp(formData: FormData) {
  const user = await requireEditor();
  const parentId = String(formData.get("parentId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!parentId) throw new Error("ไม่พบประกาศต้นเรื่อง");
  if (!title || !body) throw new Error("โพสต์ต่อจำเป็นต้องมีหัวข้อและเนื้อหา");

  await db.$transaction(async (tx) => {
    const parent = await tx.contentItem.findUnique({ where: { id: parentId } });
    if (!parent || parent.parentId) throw new Error("ไม่พบประกาศต้นเรื่อง");
    if (parent.status !== "PUBLISHED" && parent.status !== "PAST") {
      throw new Error("เพิ่มโพสต์ต่อได้เฉพาะประกาศที่เผยแพร่แล้วหรือจบแล้ว");
    }

    const child = await tx.contentItem.create({
      data: {
        title,
        body,
        type: parent.type,
        department: parent.department,
        visibility: parent.visibility,
        status: "PUBLISHED",
        parentId: parent.id,
        authorId: user.id,
      },
    });

    await writeAudit(tx, {
      actorId: user.id,
      itemId: parent.id,
      action: "UPDATE",
      detail: `เพิ่มโพสต์ต่อ ${child.id}: ${title}`,
    });
  });

  revalidatePath(`/items/${parentId}`);
  redirect(`/items/${parentId}`);
}
