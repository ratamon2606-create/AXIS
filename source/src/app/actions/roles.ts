"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import type { Role } from "@prisma/client";

/**
 * จัดการสิทธิ์ · เจ้าของไฟล์คือ Piyatida (US-8)
 *
 * SRS-12 ผู้ดูแลเปลี่ยนสิทธิ์ได้ และมีผลตั้งแต่คำขอถัดไป
 * SRS-21 บันทึกการเปลี่ยนแปลงทุกครั้ง
 *
 * ที่มีผลตั้งแต่คำขอถัดไปได้ เพราะ callback jwt อ่าน role จากฐานข้อมูลทุกครั้ง
 * ไม่ได้เก็บค้างไว้ใน token ตั้งแต่ iteration 1
 */

const ROLES: Role[] = ["READER", "EDITOR", "ADMIN"];

export async function changeRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role")) as Role;

  if (!ROLES.includes(role)) throw new Error("สิทธิ์ที่เลือกไม่ถูกต้อง");

  await db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: userId } });
    if (!target) throw new Error("ไม่พบบัญชีนี้");

    // กันไม่ให้ผู้ดูแลถอนสิทธิ์ตัวเองจนไม่เหลือผู้ดูแลในระบบ
    // ถ้าเกิดขึ้นจะไม่มีใครกู้คืนได้เลยนอกจากแก้ในฐานข้อมูลโดยตรง
    if (target.id === admin.id && role !== "ADMIN") {
      const admins = await tx.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) throw new Error("ต้องมีผู้ดูแลอย่างน้อยหนึ่งคนในระบบ");
    }

    await tx.user.update({ where: { id: userId }, data: { role } });

    await writeAudit(tx, {
      actorId: admin.id,
      action: "ROLE_CHANGE",
      detail: `${target.email} เปลี่ยนจาก ${target.role} เป็น ${role}`,
    });
  });

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

    // ถ้าบัญชีนี้เคยเข้าสู่ระบบแล้ว ให้ปรับสิทธิ์ทันทีด้วย
    // ไม่งั้นการใส่รายชื่อจะไม่มีผลกับคนที่เข้ามาก่อนแล้ว ซึ่งขัดกับที่ผู้ใช้คาดหวัง
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) await tx.user.update({ where: { email }, data: { role } });

    await writeAudit(tx, {
      actorId: admin.id,
      action: "ROLE_CHANGE",
      detail: `เพิ่ม ${email} ในรายชื่อล่วงหน้าด้วยสิทธิ์ ${role}`,
    });
  });

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
