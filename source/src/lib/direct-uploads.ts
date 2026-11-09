import { db } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { checkFile, headObject, copyObject, deleteObject, validateStoredFileType } from "@/lib/s3";

export type DirectUpload = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export const MAX_UPLOADS = 4;
export const MAX_TOTAL_BYTES = 80 * 1024 * 1024;

export function parseDirectUploadDescriptors(
  raw: FormDataEntryValue | null,
  userId: string,
  maxFiles = MAX_UPLOADS,
): DirectUpload[] {
  if (!raw || typeof raw !== "string") return [];
  if (raw.length > 16_000) throw new Error("ข้อมูลไฟล์แนบยาวเกินไป");

  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    throw new Error("ข้อมูลไฟล์แนบไม่ถูกต้อง");
  }
  if (!Array.isArray(input) || input.length > maxFiles) {
    throw new Error(`แนบไฟล์ได้สูงสุด ${maxFiles} ไฟล์`);
  }

  const seenKeys = new Set<string>();
  let totalBytes = 0;
  return input.map((entry): DirectUpload => {
    if (!entry || typeof entry !== "object") {
      throw new Error("ข้อมูลไฟล์แนบไม่ถูกต้อง");
    }
    const { storageKey, fileName, mimeType, size } = entry as Partial<DirectUpload>;
    if (
      typeof storageKey !== "string" ||
      typeof fileName !== "string" ||
      typeof mimeType !== "string" ||
      typeof size !== "number"
    ) {
      throw new Error("ข้อมูลไฟล์แนบไม่ครบ");
    }
    if (
      !/^uploads\/[a-z0-9]+\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]{1,8}$/i.test(storageKey) ||
      !storageKey.startsWith(`uploads/${userId}/`)
    ) {
      throw new Error("ไม่สามารถใช้ไฟล์ของบัญชีอื่น");
    }
    if (!fileName.trim() || fileName.length > 255 || seenKeys.has(storageKey)) {
      throw new Error("ชื่อไฟล์หรือไฟล์แนบซ้ำไม่ถูกต้อง");
    }
    if (!Number.isSafeInteger(size)) throw new Error("ขนาดไฟล์ไม่ถูกต้อง");

    const problem = checkFile({ size, type: mimeType });
    if (problem) throw new Error(`${fileName}: ${problem}`);
    totalBytes += size;
    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new Error("ไฟล์แนบรวมกันต้องไม่เกิน 80 MB");
    }
    seenKeys.add(storageKey);
    return { storageKey, fileName: fileName.trim(), mimeType, size };
  });
}

export async function verifyDirectUploads(
  raw: FormDataEntryValue | null,
  userId: string,
  maxFiles = MAX_UPLOADS,
): Promise<DirectUpload[]> {
  const uploads = parseDirectUploadDescriptors(raw, userId, maxFiles);
  for (const upload of uploads) {
    const head = await headObject(upload.storageKey);
    if (
      !head ||
      head.ContentLength !== upload.size ||
      head.ContentType !== upload.mimeType
    ) {
      throw new Error(`ไฟล์ ${upload.fileName} อัปโหลดไม่สำเร็จหรือข้อมูลไม่ตรงกัน`);
    }
    await validateStoredFileType(upload.storageKey, upload.mimeType);
    const inUse = await db.attachment.findUnique({
      where: { storageKey: upload.storageKey },
      select: { id: true },
    });
    if (inUse) throw new Error("ไฟล์นี้ถูกใช้งานไปแล้ว กรุณาอัปโหลดอีกครั้ง");
  }
  return uploads;
}

export function requireNoMultipartFiles(formData: FormData, ...fields: string[]) {
  for (const field of fields) {
    for (const value of formData.getAll(field)) {
      if (value instanceof File && value.size > 0) {
        throw new Error("กรุณาอัปโหลดไฟล์ผ่านระบบ Direct Upload ก่อนบันทึก");
      }
    }
  }
}

/** Return immutable keys for DB storage; cleanup copies on failure. */
export async function promoteUploads(uploads: DirectUpload[], itemId: string): Promise<DirectUpload[]> {
  const created: DirectUpload[] = [];
  try {
    for (const upload of uploads) {
      const extension = upload.storageKey.split(".").pop()!;
      const storageKey = `items/${itemId}/${randomUUID()}.${extension}`;
      await copyObject(upload.storageKey, storageKey);
      created.push({ ...upload, storageKey });
      await validateStoredFileType(storageKey, upload.mimeType);
    }
    return created;
  } catch (error) {
    await cleanupUploads(created);
    throw error;
  }
}

export async function cleanupUploads(uploads: DirectUpload[]): Promise<void> {
  await Promise.all(uploads.map((u) => deleteObject(u.storageKey).catch((error) => {
    console.error("Object cleanup failed", { key: u.storageKey, error });
  })));
}
