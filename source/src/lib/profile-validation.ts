/** Validates the onboarding/profile form. Returns a Thai error message, or null when valid. */
export function validateProfile(program: string, year: number): string | null {
  if (program !== "CPE" && program !== "SKE") return "กรุณาเลือกหลักสูตร";
  if (!Number.isInteger(year) || year < 1 || year > 8) return "กรุณาเลือกชั้นปี";
  return null;
}
