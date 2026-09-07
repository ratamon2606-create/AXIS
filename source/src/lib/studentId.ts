import type { Department } from "@prisma/client";

/**
 * แยกภาควิชาและชั้นปีจากรหัสนิสิต
 *
 * ตำแหน่งที่ใช้ 6810545883
 *   ตัวที่ 1-2  68  ปีการศึกษาที่เข้า (พ.ศ. สองหลักท้าย)
 *   ตัวที่ 6-7  45  รหัสภาควิชา 45 = SKE, 40 = CPE
 *
 * ชั้นปี = ปีการศึกษาปัจจุบัน - ปีที่เข้า + 1
 * ปีการศึกษาปัจจุบันอ่านจาก env เพื่อให้ไม่ต้องแก้โค้ดเมื่อขึ้นปีใหม่
 */

export const DEPARTMENT_CODES: Record<string, Department> = {
  "45": "SKE",
  "40": "CPE",
};

export type ParsedStudentId =
  | { ok: true; department: Department; year: number; admissionYear: number }
  | { ok: false; reason: string };

export function currentAcademicYearBE(): number {
  const fromEnv = Number(process.env.ACADEMIC_YEAR_BE);
  return Number.isInteger(fromEnv) && fromEnv > 2500 ? fromEnv : 2569;
}

export function parseStudentId(raw: string): ParsedStudentId {
  const id = raw.replace(/\D/g, "");

  if (id.length !== 10) {
    return { ok: false, reason: "รหัสนิสิตต้องมี 10 หลัก" };
  }

  const deptCode = id.slice(5, 7);
  const department = DEPARTMENT_CODES[deptCode];
  if (!department) {
    return {
      ok: false,
      reason: `รหัสนี้เป็นของภาควิชาอื่น (รหัสภาค ${deptCode}) ระบบนี้รองรับเฉพาะ CPE และ SKE`,
    };
  }

  const admissionYear = 2500 + Number(id.slice(0, 2));
  const year = currentAcademicYearBE() - admissionYear + 1;

  if (year < 1 || year > 8) {
    return {
      ok: false,
      reason: `คำนวณชั้นปีได้ ${year} ซึ่งอยู่นอกช่วงที่รับได้ ตรวจสอบรหัสอีกครั้ง`,
    };
  }

  return { ok: true, department, year, admissionYear };
}
