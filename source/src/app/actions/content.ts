"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { TYPE_FIELDS } from "@/lib/items";
import type { Department, ItemType, Visibility } from "@prisma/client";

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
 * ตรวจซ้ำที่ฝั่ง server แม้ฟอร์มจะตรวจให้แล้ว เพื่อให้หน้าที่เขียนทีหลังข้ามไม่ได้
 */
function validate(formData: FormData) {
  const missing: string[] = [];
  if (!String(formData.get("title") ?? "").trim()) missing.push("หัวข้อ");
  if (!String(formData.get("body") ?? "").trim()) missing.push("เนื้อหา");
  const dept = String(formData.get("department") ?? "");
  if (dept !== "CPE" && dept !== "SKE") missing.push("ภาควิชา");
  if (missing.length) throw new Error(`ยังไม่ได้กรอก: ${missing.join(", ")}`);
}

export async function createItem(formData: FormData) {
  const user = await requireEditor();
  validate(formData);

  const type = String(formData.get("type") ?? "NEWS") as ItemType;

  const item = await db.contentItem.create({
    data: {
      title: String(formData.get("title")).trim(),
      body: String(formData.get("body")).trim(),
      type,
      department: String(formData.get("department")) as Department,
      // SRS-17 ค่าเริ่มต้นคือเฉพาะบัญชีมหาวิทยาลัย
      visibility: (String(formData.get("visibility") ?? "KU_ONLY") as Visibility),
      status: formData.get("publish") === "1" ? "PUBLISHED" : "DRAFT",
      details: readDetails(type, formData),
      imageUrl: String(formData.get("imageUrl") ?? "") || null,
      authorId: user.id,
    },
  });

  revalidatePath("/");
  redirect(`/items/${item.id}`);
}

export async function updateItem(formData: FormData) {
  const user = await requireEditor();
  validate(formData);

  const id = String(formData.get("id"));
  const type = String(formData.get("type") ?? "NEWS") as ItemType;

  await db.contentItem.update({
    where: { id },
    data: {
      title: String(formData.get("title")).trim(),
      body: String(formData.get("body")).trim(),
      type,
      department: String(formData.get("department")) as Department,
      visibility: String(formData.get("visibility") ?? "KU_ONLY") as Visibility,
      details: readDetails(type, formData),
      imageUrl: String(formData.get("imageUrl") ?? "") || null,
    },
  });

  void user;
  revalidatePath("/");
  redirect(`/items/${id}`);
}
