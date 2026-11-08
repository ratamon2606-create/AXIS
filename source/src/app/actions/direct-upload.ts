"use server";

import { randomUUID } from "node:crypto";
import { requireEditor } from "@/lib/auth";
import { checkFile, signedUploadUrl } from "@/lib/s3";

export async function requestDirectUpload(fileName: string, mimeType: string, size: number) {
  const editor = await requireEditor();
  if (typeof fileName !== "string" || !fileName.trim() || fileName.length > 255) throw new Error("ชื่อไฟล์ไม่ถูกต้อง");
  if (!Number.isSafeInteger(size)) throw new Error("ขนาดไฟล์ไม่ถูกต้อง");
  const problem = checkFile({ size, type: mimeType });
  if (problem) throw new Error(problem);
  const ext = fileName.split(".").pop()?.toLowerCase() || "bin";
  const safeExt = /^[a-z0-9]{1,8}$/.test(ext) ? ext : "bin";
  const storageKey = `uploads/${editor.id}/${randomUUID()}/${randomUUID()}.${safeExt}`;
  const url = await signedUploadUrl(storageKey, mimeType);
  return { url, storageKey, fileName, mimeType, size };
}
