import { prisma } from "@/lib/prisma";
import { decryptTotpSecret, encryptTotpSecret } from "@/lib/crypto/totp-secret";
import { generateTotpSecret } from "@/lib/totp";

/**
 * Returns the user's pending (not yet confirmed) TOTP secret, generating
 * and persisting one on first call. Reusing an existing pending secret
 * keeps the QR code stable across page reloads during setup — generating a
 * fresh one every render would silently invalidate a code the user already
 * scanned. The secret only becomes meaningful once a correct code is
 * verified and User.twoFactorEnabled is set true elsewhere; storing it
 * before that point is inert (2FA isn't required yet) and lets setup
 * survive a refresh or a dropped connection.
 */
export async function getOrCreatePendingTotpSecret(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.twoFactorSecret) {
    return decryptTotpSecret(user.twoFactorSecret);
  }

  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: encryptTotpSecret(secret) },
  });

  return secret;
}
