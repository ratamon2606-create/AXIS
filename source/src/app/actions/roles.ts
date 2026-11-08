"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { assertAdminRetention } from "@/lib/role-policy";
import type { Role } from "@prisma/client";


const ROLES: Role[] = ["READER", "EDITOR", "ADMIN"];

const ROLE_LABEL: Record<Role, string> = {
  READER: "ผู้อ่าน",
  EDITOR: "ผู้เขียน",
  ADMIN: "ผู้ดูแลระบบ",
};

export async function changeRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role")) as Role;

  if (!ROLES.includes(role)) throw new Error("สิทธิ์ที่เลือกไม่ถูกต้อง");

  await db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: userId } });
    if (!target) throw new Error("ไม่พบบัญชีนี้");

    await assertAdminRetention(tx, target.role, role);

    await tx.user.update({ where: { id: userId }, data: { role } });

    await writeAudit(tx, {
      actorId: admin.id,
      action: "ROLE_CHANGE",
      detail: `${target.email} เปลี่ยนจาก ${ROLE_LABEL[target.role]} เป็น ${ROLE_LABEL[role]}`,
    });
  }, { isolationLevel: "Serializable" });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

/**
 * ใส่อีเมลไว้ล่วงหน้าสำหรับคนที่ยังไม่เคยเข้าสู่ระบบ
 * แก้ปัญหาไก่กับไข่ คือระบบรู้จักบัญชีต่อเมื่อเข้าสู่ระบบแล้ว
 * แต่บางคนต้องมีสิทธิ์ตั้งแต่ครั้งแรกที่เข้า
 */
export async function addToAllowlist(formData: FormData) {
  const admin = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "EDITOR") as Role;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!email.includes("@")) throw new Error("อีเมลไม่ถูกต้อง");
  if (!ROLES.includes(role)) throw new Error("สิทธิ์ที่เลือกไม่ถูกต้อง");

  await db.$transaction(async (tx) => {
    await tx.allowlist.upsert({
      where: { email },
      create: { email, role, note },
      update: { role, note },
    });

    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      await assertAdminRetention(tx, existing.role, role);
      await tx.user.update({ where: { email }, data: { role } });
    }

    await writeAudit(tx, {
      actorId: admin.id,
      action: "ROLE_CHANGE",
      detail: `เพิ่ม ${email} ในรายชื่อล่วงหน้าด้วยสิทธิ์ ${ROLE_LABEL[role]}`,
    });
  }, { isolationLevel: "Serializable" });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
