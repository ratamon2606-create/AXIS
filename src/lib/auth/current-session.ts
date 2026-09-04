import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

/**
 * Auth.js v5 database-strategy sessions store the raw sessionToken directly
 * as the cookie value (no JWE wrapping) — see the shipped defaults in
 * node_modules/@auth/core/lib/utils/cookie.js. The cookie is named
 * "authjs.session-token", or "__Secure-authjs.session-token" when the
 * request is served over HTTPS (Auth.js switches the prefix per-request,
 * not per-environment) — both variants are matched here rather than
 * assuming one, so this keeps working in both local http dev and a real
 * https deployment without hard-coding which one applies.
 */
const SESSION_COOKIE_PATTERN = /^(__Secure-)?authjs\.session-token$/;

export async function getCurrentSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const match = cookieStore.getAll().find((cookie) =>
    SESSION_COOKIE_PATTERN.test(cookie.name),
  );
  return match?.value ?? null;
}

/**
 * Resolves the exact database Session row (and its User) tied to the
 * current browser's session cookie — never "the newest session for this
 * user" or any other userId-based guess. This is what makes per-browser
 * 2FA state correct: two browsers signed into the same account hold two
 * distinct sessionToken cookies, and therefore two distinct Session rows.
 *
 * Also enforces `expires`, mirroring exactly what Auth.js's own database
 * strategy does in @auth/core/lib/actions/session.js (it deletes the row
 * and treats the session as invalid once `expires` has passed). This path
 * is a separate, direct Prisma query — without this check it would treat a
 * session as valid past the point Auth.js's own /api/auth/session endpoint
 * already considers it expired and deletes it.
 */
export async function getCurrentDbSession() {
  const sessionToken = await getCurrentSessionToken();
  if (!sessionToken) {
    return null;
  }

  const dbSession = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!dbSession) {
    return null;
  }

  if (dbSession.expires.getTime() < Date.now()) {
    await prisma.session.delete({ where: { sessionToken } }).catch(() => {});
    return null;
  }

  return dbSession;
}
