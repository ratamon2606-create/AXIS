import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const ENDPOINT = process.env.S3_ENDPOINT ?? "http://localhost:9000";
const BUCKET = process.env.S3_BUCKET ?? "hub-files";

// ที่อยู่สำหรับฝั่งเบราว์เซอร์ใช้งาน (ป้องกันปัญหาชี้ไปที่ localhost บนเครื่องผู้ใช้)
const PUBLIC_ENDPOINT = process.env.S3_PUBLIC_ENDPOINT ?? ENDPOINT;

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: ENDPOINT,
  forcePathStyle: true, // รองรับรูปแบบ Path Style ของ MinIO
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
});

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

// ประเภทไฟล์ที่อนุญาต (จำกัดเฉพาะเอกสารและรูปภาพทั่วไป)
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

// สร้าง Key สำหรับจัดเก็บไฟล์โดยใช้ UUID เพื่อป้องกันปัญหาชื่อไฟล์ซ้ำหรืออักขระพิเศษ
export function makeStorageKey(itemId: string, fileName: string): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "bin";
  return `items/${itemId}/${randomUUID()}.${ext}`;
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

// สร้าง Signed URL ที่มีอายุใช้งาน 5 นาที (ต้องผ่านการตรวจสอบสิทธิ์ในระบบก่อนเรียกใช้งาน)
async function signedObjectUrl(
  key: string,
  fileName: string,
  disposition: "attachment" | "inline"
): Promise<string> {
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    }),
    { expiresIn: 300 }
  );

  return PUBLIC_ENDPOINT === ENDPOINT ? url : url.replace(ENDPOINT, PUBLIC_ENDPOINT);
}

export async function signedDownloadUrl(key: string, fileName: string): Promise<string> {
  return signedObjectUrl(key, fileName, "attachment");
}

// สำหรับแสดงผลรูปภาพแบบ Inline เช่น Preview ในหน้าประกาศ
export async function signedInlineUrl(key: string, fileName: string): Promise<string> {
  return signedObjectUrl(key, fileName, "inline");
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}