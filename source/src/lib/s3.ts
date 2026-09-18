import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

/**
 * ที่เก็บไฟล์แนบ · เจ้าของไฟล์คือ Thanakorn (US-6)
 *
 * SRS-7 ตรวจสิทธิ์ก่อนออกลิงก์ และลิงก์หมดอายุใน 5 นาที
 * NFR-4 ไฟล์ไม่เกิน 20 MB และจำกัดชนิดไฟล์
 *
 * ทำไมไม่เก็บไฟล์ในฐานข้อมูล
 *   ฐานข้อมูลจะโตเกินกว่าข้อมูลที่สำคัญจริง การสำรองข้อมูลจะช้าลงมาก
 *   และทุกการดาวน์โหลดต้องวิ่งผ่านแอป ซึ่งกินหน่วยความจำของเซิร์ฟเวอร์โดยไม่จำเป็น
 *
 * ทำไมไม่เปิด bucket เป็นสาธารณะ
 *   ไฟล์ของประกาศที่จำกัดต้องไม่กลายเป็นลิงก์สาธารณะถาวร
 *   การออกลิงก์ที่หมดอายุทำให้ลิงก์ที่ถูกส่งต่อใช้ไม่ได้หลังห้านาที
 */

const ENDPOINT = process.env.S3_ENDPOINT ?? "http://localhost:9000";
const BUCKET = process.env.S3_BUCKET ?? "hub-files";

/**
 * ที่อยู่ที่เบราว์เซอร์ใช้ อาจต่างจากที่อยู่ที่เซิร์ฟเวอร์ใช้
 * ตอน deploy จริงถ้าลืมตั้งค่านี้ ลิงก์จะชี้ไป localhost แล้วผู้ใช้โหลดไม่ได้
 */
const PUBLIC_ENDPOINT = process.env.S3_PUBLIC_ENDPOINT ?? ENDPOINT;

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: ENDPOINT,
  forcePathStyle: true, // MinIO ต้องใช้รูปแบบนี้ ไม่ใช่ virtual-hosted style
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
});

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** NFR-4 จำกัดชนิดไฟล์ที่รับ ไม่รับไฟล์ปฏิบัติการหรือไฟล์บีบอัด */
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
  if (!ALLOWED_MIME.has(file.type)) return "รับเฉพาะ PDF รูปภาพ และเอกสาร Office";
  return null;
}

/**
 * สร้างชื่อไฟล์ในที่เก็บด้วย UUID ไม่ใช้ชื่อเดิมของผู้ใช้
 * เพราะชื่อไฟล์ภาษาไทยหรือชื่อที่มีอักขระพิเศษทำให้เกิดปัญหาตอนเรียกคืน
 * และชื่อซ้ำกันจะเขียนทับกัน ส่วนชื่อจริงเก็บไว้ในฐานข้อมูลเพื่อแสดงผล
 */
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

/**
 * ออกลิงก์ที่หมดอายุใน 5 นาที
 * ต้องเรียกหลังตรวจสิทธิ์แล้วเท่านั้น ฟังก์ชันนี้ไม่ได้ตรวจอะไรเอง
 */
export async function signedDownloadUrl(key: string, fileName: string): Promise<string> {
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      // บังคับให้เบราว์เซอร์ดาวน์โหลดด้วยชื่อจริง แทนที่จะเปิดไฟล์ UUID
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    }),
    { expiresIn: 300 }
  );

  return PUBLIC_ENDPOINT === ENDPOINT ? url : url.replace(ENDPOINT, PUBLIC_ENDPOINT);
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
