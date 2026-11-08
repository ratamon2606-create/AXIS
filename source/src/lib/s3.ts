import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";


const ENDPOINT = process.env.S3_ENDPOINT ?? "http://localhost:9000";
const BUCKET = process.env.S3_BUCKET ?? "hub-files";
const PUBLIC_ENDPOINT = process.env.S3_PUBLIC_ENDPOINT ?? ENDPOINT;

const clientConfig = {
  region: process.env.S3_REGION ?? "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
};

const s3 = new S3Client({ ...clientConfig, endpoint: ENDPOINT });

// SigV4 includes the host; sign against the endpoint used by the browser.
const publicS3 = new S3Client({ ...clientConfig, endpoint: PUBLIC_ENDPOINT });

export { checkFile, MAX_FILE_BYTES, ALLOWED_MIME } from "@/lib/file-validation";

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
async function signedObjectUrl(
  key: string,
  fileName: string,
  disposition: "attachment" | "inline"
): Promise<string> {
  const url = await getSignedUrl(
    publicS3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `${disposition}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    }),
    { expiresIn: 300 }
  );

  return url;
}

export async function signedDownloadUrl(key: string, fileName: string): Promise<string> {
  return signedObjectUrl(key, fileName, "attachment");
}

/** ใช้สำหรับรูป preview ในหน้า thread หลังจาก route ตรวจสิทธิ์แล้ว */
export async function signedInlineUrl(key: string, fileName: string): Promise<string> {
  return signedObjectUrl(key, fileName, "inline");
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Browser uploads bypass Vercel's 4.5 MB Function request limit. */
export async function signedUploadUrl(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    publicS3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );
}

export async function headObject(key: string) {
  try {
    return await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (error) {
    if (typeof error === "object" && error && ("name" in error) &&
      ["NotFound", "NoSuchKey", "404"].includes(String(error.name))) return null;
    throw error;
  }
}

/** Promote temporary browser-writable objects into a key the browser was never given
 *  PUT permission for. Otherwise a still-valid upload URL could replace a file
 *  after metadata validation and publication. */
export async function copyObject(sourceKey: string, destinationKey: string): Promise<void> {
  await s3.send(new CopyObjectCommand({
    Bucket: BUCKET,
    Key: destinationKey,
    CopySource: encodeURI(`${BUCKET}/${sourceKey}`),
  }));
}

/** Inspect stored bytes, not only a MIME string supplied by the browser.
 *  Office formats are ZIP containers; this checks their container signature,
 *  not the internal Office schema or malware (separate production controls).
 */
export async function validateStoredFileType(key: string, mimeType: string): Promise<void> {
  const result = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key, Range: "bytes=0-15" }));
  if (!result.Body) throw new Error("ไม่สามารถตรวจสอบชนิดไฟล์ได้");
  const bytes = await result.Body.transformToByteArray();
  const has = (...expected: number[]) => expected.every((value, index) => bytes[index] === value);
  const isOffice = mimeType.startsWith("application/vnd.openxmlformats-officedocument.");
  const okay =
    (mimeType === "application/pdf" && has(0x25, 0x50, 0x44, 0x46, 0x2d)) ||
    (mimeType === "image/jpeg" && has(0xff, 0xd8, 0xff)) ||
    (mimeType === "image/png" && has(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) ||
    (mimeType === "image/webp" && has(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) ||
    (isOffice && has(0x50, 0x4b, 0x03, 0x04));
  if (!okay) throw new Error("ชนิดไฟล์จริงไม่ตรงกับประเภทที่อัปโหลด");
}
