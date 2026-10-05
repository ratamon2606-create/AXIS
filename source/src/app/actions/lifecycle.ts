"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin, requireEditor } from "@/lib/auth";
import { canEditItem } from "@/lib/items";
import { writeAudit } from "@/lib/audit";

async function editableItem(id: string) {
  const user = await requireEditor();
  const item = await db.contentItem.findUnique({ where: { id } });
  if (!item) throw new Error("ไม่พบประกาศนี้");
  if (!canEditItem(user, item)) throw new Error("แก้ไขได้เฉพาะประกาศของตัวเอง");
  return { user, item };
}

export async function markPast(formData: FormData) {
  const id = String(formData.get("id"));
  const { user, item } = await editableItem(id);
  if (item.status !== "PUBLISHED") throw new Error("ประกาศนี้ไม่ได้อยู่ในสถานะเผยแพร่");

  await db.$transaction(async (tx) => {
    await tx.contentItem.update({ where: { id }, data: { status: "PAST" } });
    await writeAudit(tx, {
      actorId: user.id,
      itemId: id,
      action: "MARK_PAST",
      detail: `ปิดก่อนกำหนด เดิมหมดเขต ${item.expiresAt?.toISOString() ?? "ไม่ระบุ"}`,
    });
  });

  revalidatePath("/");
  revalidatePath("/past");
  revalidatePath("/announcements");
  redirect(`/items/${id}`);
}

export async function extendItem(formData: FormData) {
  const id = String(formData.get("id"));
  const days = Number(formData.get("days") ?? 30);
  const { user, item } = await editableItem(id);

  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error("จำนวนวันที่ต่ออายุต้องอยู่ระหว่าง 1 ถึง 365");
  }
  if (item.status === "HIDDEN") throw new Error("ประกาศที่ซ่อนถาวรแล้วต่ออายุไม่ได้");

  const next = new Date(Date.now() + days * 86_400_000);
  await db.$transaction(async (tx) => {
    await tx.contentItem.update({ where: { id }, data: { status: "PUBLISHED", expiresAt: next } });
    await writeAudit(tx, {
      actorId: user.id,
      itemId: id,
      action: "EXTEND",
      detail: `ต่ออายุ ${days} วัน`,
    });
  });

  revalidatePath("/");
  revalidatePath("/past");
  revalidatePath("/announcements");
  redirect(`/items/${id}`);
}

export async function setPinned(formData: FormData) {
  const id = String(formData.get("id"));
  const { user, item } = await editableItem(id);
  const pinned = formData.get("pinned") === "1";

  await db.$transaction(async (tx) => {
    await tx.contentItem.update({ where: { id }, data: { pinned } });
    await writeAudit(tx, {
      actorId: user.id,
      itemId: id,
      action: pinned ? "PIN" : "UNPIN",
    });
  });

  revalidatePath("/");
  revalidatePath("/announcements");
  revalidatePath(`/items/${id}`);
}

export async function hideItem(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  const item = await db.contentItem.findUnique({ where: { id } });
  if (!item) throw new Error("ไม่พบประกาศนี้");

  await db.$transaction(async (tx) => {
    await tx.contentItem.update({ where: { id }, data: { status: "HIDDEN" } });
    await writeAudit(tx, {
      actorId: admin.id,
      itemId: id,
      action: "HIDE",
      detail: `ซ่อนถาวร ${item.title}`,
    });
  });

  revalidatePath("/");
  revalidatePath("/past");
  revalidatePath("/search");
  revalidatePath("/announcements");
  revalidatePath("/admin");
  redirect("/admin");
}
