/** Normalizes an email typed by an admin. Returns null when it is not a plausible address. */
export function normalizeAllowlistEmail(raw: unknown): string | null {
  const email = String(raw ?? "").trim().toLowerCase();
  if (email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
