"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentDbSession } from "@/lib/auth/current-session";
import { decryptTotpSecret } from "@/lib/crypto/totp-secret";
import { verifyTotpCode } from "@/lib/totp";

/**
 * Confirms first-time TOTP enrollment. A correct code is the ONLY thing
 * that turns User.twoFactorEnabled on — generating/displaying the QR code
 * earlier does not. On success, enabling the account and marking the exact
 * current session verified happen together in one transaction.
 */
export async function confirmTotpSetup(formData: FormData) {
  const dbSession = await getCurrentDbSession();
  if (!dbSession) {
    redirect("/login");
  }

  if (dbSession.user.twoFactorEnabled) {
    redirect(dbSession.twoFactorVerified ? "/" : "/auth/2fa/verify");
  }

  if (!dbSession.user.twoFactorSecret) {
    redirect("/auth/2fa/setup");
  }

  const code = String(formData.get("code") ?? "");
  const secret = decryptTotpSecret(dbSession.user.twoFactorSecret);
  const valid = await verifyTotpCode(secret, code);

  if (!valid) {
    redirect("/auth/2fa/setup?error=1");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: dbSession.userId },
      data: { twoFactorEnabled: true },
    }),
    prisma.session.update({
      where: { sessionToken: dbSession.sessionToken },
      data: { twoFactorVerified: true },
    }),
  ]);

  redirect("/");
}

/**
 * Verifies the second factor for a returning user on an already-enrolled
 * account. Only the exact current Session row (resolved from this
 * browser's own session cookie) is updated — a second factor passed in one
 * browser must never verify a different session for the same account.
 */
export async function confirmTotpLogin(formData: FormData) {
  const dbSession = await getCurrentDbSession();
  if (!dbSession) {
    redirect("/login");
  }

  if (!dbSession.user.twoFactorEnabled || !dbSession.user.twoFactorSecret) {
    redirect("/auth/2fa/setup");
  }

  if (dbSession.twoFactorVerified) {
    redirect("/");
  }

  const code = String(formData.get("code") ?? "");
  const secret = decryptTotpSecret(dbSession.user.twoFactorSecret);
  const valid = await verifyTotpCode(secret, code);

  if (!valid) {
    redirect("/auth/2fa/verify?error=1");
  }

  await prisma.session.update({
    where: { sessionToken: dbSession.sessionToken },
    data: { twoFactorVerified: true },
  });

  redirect("/");
}
