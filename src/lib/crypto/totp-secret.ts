import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Centralized at-rest encryption for TOTP secrets (AES-256-GCM). The key is
 * never hard-coded — it comes from TOTP_ENCRYPTION_KEY, a dedicated env var
 * separate from AUTH_SECRET (which protects Auth.js's own cookies/CSRF
 * state, not application data).
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.TOTP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("TOTP_ENCRYPTION_KEY is not set");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "TOTP_ENCRYPTION_KEY must be a base64-encoded 32-byte (AES-256) key",
    );
  }

  return key;
}

/** Encrypts a plaintext TOTP secret for storage in User.twoFactorSecret. */
export function encryptTotpSecret(plainTextSecret: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainTextSecret, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/** Reverses encryptTotpSecret. Throws if the ciphertext or key is invalid. */
export function decryptTotpSecret(cipherText: string): string {
  const key = getEncryptionKey();
  const raw = Buffer.from(cipherText, "base64");

  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
