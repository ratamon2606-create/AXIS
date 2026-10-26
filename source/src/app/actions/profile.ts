"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

function parseProfile(formData: FormData) {
  const program = String(
    formData.get("program") ?? "",
  ) as Program;

  const year = Number(
    formData.get("year") ?? 0,
  );

  return {
    program,
    year,
  };
}

function validateProfile(
  program: Program,
  year: number,
) {
  if (
    program !== "CPE" &&
    program !== "SKE"
  ) {
    return "กรุณาเลือกหลักสูตร";
  }

  if (
    !Number.isInteger(year) ||
    year < 1 ||
    year > 8
  ) {
    return "กรุณาเลือกชั้นปี";
  }

  return null;
}

export async function saveProfile(
  formData: FormData,
) {
  const user = await requireUser();

  const {
    program,
    year,
  } = parseProfile(formData);

  const error =
    validateProfile(
      program,
      year,
    );

  if (error) {
    redirect(
      "/onboarding?err=" +
        encodeURIComponent(error),
    );
  }

  await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      program,
      year,
    },
  });

  redirect("/");
}

/**
 * แก้ไขหลักสูตรและชั้นปีจากหน้าโปรไฟล์
 *
 * ข้อมูลนี้มีผลกับ personalization / ranking เท่านั้น
 * ไม่เปลี่ยนสิทธิ์ READER / EDITOR / ADMIN
 */
export async function updateProfile(
  formData: FormData,
) {
  const user = await requireUser();

  const {
    program,
    year,
  } = parseProfile(formData);

  const error =
    validateProfile(
      program,
      year,
    );

  if (error) {
    redirect(
      "/me?err=" +
        encodeURIComponent(error),
    );
  }

  await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      program,
      year,
    },
  });

  /*
   * These screens use program/year for relevance and personalization.
   * Revalidate them so the changed profile is reflected immediately.
   */
  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/announcements");
  revalidatePath("/search");
  revalidatePath("/calendar");
  revalidatePath("/saved");

  redirect("/me?updated=1");
}
