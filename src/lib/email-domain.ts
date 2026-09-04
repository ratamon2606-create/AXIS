/**
 * SRS-10: only accounts whose email domain is exactly `ku.th` may sign in.
 *
 * Deliberately not a substring/endsWith check: the local part is split off
 * first and the remainder is compared for strict equality against the
 * allowed domain, so "student@ku.th.example.com" and "student@notku.th"
 * are rejected rather than merely "containing" ku.th.
 */
export const ALLOWED_EMAIL_DOMAIN = "ku.th";

export function isAllowedUniversityEmail(
  email: string | null | undefined,
  allowedDomain: string = ALLOWED_EMAIL_DOMAIN,
): boolean {
  if (!email) return false;

  const parts = email.trim().split("@");
  if (parts.length !== 2) return false;

  const [localPart, domain] = parts;
  if (!localPart) return false;

  return domain.toLowerCase() === allowedDomain.toLowerCase();
}
