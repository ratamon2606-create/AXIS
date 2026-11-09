export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export function checkFile(file: { size: number; type: string }): string | null {
  if (file.size === 0) return "ไฟล์ว่าง";
  if (file.size > MAX_FILE_BYTES) return "ไฟล์ใหญ่เกิน 20 MB";
  if (!ALLOWED_MIME.has(file.type)) return "รับเฉพาะ PDF รูปภาพ และเอกสารสำนักงาน";
  return null;
}
