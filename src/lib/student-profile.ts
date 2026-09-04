import type { Department } from "@/generated/prisma/enums";

/**
 * Server-side validation for onboarding (Step 4).
 *
 * IMPORTANT: the AXIS SRS does not define a Student ID format, nor any rule
 * for deriving a department (CPE/SKE) from a Student ID, and no such rule
 * exists anywhere else in this repository either. Department is therefore
 * always an explicit user selection, never inferred from studentId. If an
 * official mapping is documented later, it belongs in one shared function
 * here — do not re-derive it ad hoc elsewhere.
 */

export const DEPARTMENTS = ["CPE", "SKE"] as const satisfies readonly Department[];

export function isValidDepartment(value: unknown): value is Department {
  return typeof value === "string" && (DEPARTMENTS as readonly string[]).includes(value);
}

// Not an official university rule — just a sanity bound so the year-of-study
// selector has finite options. No range for this is documented anywhere.
export const MIN_YEAR_OF_STUDY = 1;
export const MAX_YEAR_OF_STUDY = 6;

export function isValidYearOfStudy(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_YEAR_OF_STUDY &&
    value <= MAX_YEAR_OF_STUDY
  );
}

// Every Student ID example in the AXIS SRS is a bare digit string (e.g.
// "6812345678"); this is a general sanity check on that observed shape, not
// an officially documented format spec.
const STUDENT_ID_PATTERN = /^\d{6,12}$/;

export function normalizeStudentId(rawValue: string): string {
  return rawValue.trim();
}

export function isValidStudentId(value: string): boolean {
  return STUDENT_ID_PATTERN.test(value);
}
