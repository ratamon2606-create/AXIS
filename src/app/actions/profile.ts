"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseStudentId } from "@/lib/studentId";
import type { Department } from "@prisma/client";

/**
 * ตั้งค่าครั้งแรก ผู้ใช้กรอกรหัสนิสิต ระบบแยกภาควิชาและชั้นปีเอง
 * ค่าที่ได้ใช้กรองประกาศเท่านั้น ไม่ใช้ตัดสินสิทธิ์ในการเข้าถึงหรือการเขียน
 *
 * เจ้าของไฟล์นี้คือ A (US-4)
 */
export async function saveProfile(formData: FormData) {
  const user = await requireUser();
  const parsed = parseStudentId(String(formData.get("studentId") ?? ""));

  if (!parsed.ok) redirect(`/onboarding?err=${encodeURIComponent(parsed.reason)}`);

  await db.user.update({
    where: { id: user.id },
    data: { department: parsed.department as Department, year: parsed.year },
  });
  redirect("/");
}
