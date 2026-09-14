import * as OTPAuth from "otpauth";

const ISSUER = "ศูนย์ข่าวสารภาควิชา";

export const TWO_FACTOR_MAX_ATTEMPTS = 5;
export const TWO_FACTOR_LOCK_MINUTES = 5;

export function generateTwoFactorSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

function buildTotp(secret: string, email: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export function buildTwoFactorUri(secret: string, email: string): string {
  return buildTotp(secret, email).toString();
}

/** window: 1 = ยอมรับรหัสของช่วงก่อน/หลังปัจจุบันด้วย กันเคสนาฬิกาเครื่องคลาดเล็กน้อย */
export function verifyTwoFactorCode(secret: string, email: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const delta = buildTotp(secret, email).validate({ token: code, window: 1 });
  return delta !== null;
}
