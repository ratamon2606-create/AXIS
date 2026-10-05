"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { Program } from "@prisma/client";

/**
 * ตั้งค่าครั้งแรก ผู้ใช้เลือกหลักสูตรและชั้นปีเอง
 *
 * เคยลองแยกสองค่านี้จากรหัสนิสิตอัตโนมัติ แต่เลิกใช้เพราะรหัสภาคในเลขประจำตัว
 * ไม่ได้แยก CPE กับ SKE ออกจากกันอย่างที่เข้าใจไว้ตอนแรก
 * การเดาผิดจะทำให้ผู้ใช้เห็นประกาศผิดกลุ่มตลอดไปโดยไม่รู้ตัว
 * จึงถามตรง ๆ ดีกว่า
 *
 * ค่าที่ได้ใช้กรองและจัดลำดับประกาศเท่านั้น ไม่ใช้ตัดสินสิทธิ์ในการเข้าถึงหรือการเขียน
 * เพราะเป็นค่าที่ผู้ใช้กรอกเอง ไม่ได้ยืนยันกับระบบทะเบียน
 */
export async function saveProfile(formData: FormData) {
  const user = await requireUser();

  const program = String(formData.get("program") ?? "") as Program;
  const year = Number(formData.get("year") ?? 0);

  if (program !== "CPE" && program !== "SKE") {
    redirect("/onboarding?err=" + encodeURIComponent("เลือกหลักสูตรก่อน"));
  }
  if (!Number.isInteger(year) || year < 1 || year > 8) {
    redirect("/onboarding?err=" + encodeURIComponent("เลือกชั้นปีก่อน"));
  }

  await db.user.update({
    where: { id: user.id },
    data: { program, year },
  });
  redirect("/");
}
