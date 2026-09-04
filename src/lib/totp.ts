import { generateSecret, generateURI, verify } from "otplib";

/**
 * RFC 6238 TOTP (SHA-1, 6 digits, 30s step) via otplib's audited default
 * plugins (@noble/hashes + @scure/base). These are exactly the parameters
 * every mainstream authenticator app (Google Authenticator, Microsoft
 * Authenticator, Authy, 1Password) expects — deviating from any of them
 * (algorithm, digit count, period) would break compatibility.
 */

const ISSUER = "AXIS";

export function generateTotpSecret(): string {
  return generateSecret();
}

export function buildOtpauthUri(secret: string, accountLabel: string): string {
  return generateURI({ issuer: ISSUER, label: accountLabel, secret });
}

const CODE_PATTERN = /^\d{6}$/;

/**
 * epochTolerance of 30s accepts the adjacent time step on either side of
 * "now", absorbing ordinary clock drift between the user's phone and the
 * server without meaningfully widening the guessable window.
 */
export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  const trimmed = code.trim();
  if (!CODE_PATTERN.test(trimmed)) {
    return false;
  }

  const result = await verify({ secret, token: trimmed, epochTolerance: 30 });
  return result.valid;
}
