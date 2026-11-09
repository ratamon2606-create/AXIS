import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Prisma, PrismaClient, type ContentItem } from "@prisma/client";

type AttachmentData = {
  id: string;
  itemId: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  createdAt: string;
  localFile: string;
  sha256: string;
};
type ItemData = {
  id: string;
  title: string;
  body: string;
  type: ContentItem["type"];
  audience: ContentItem["audience"];
  targetYear: number | null;
  visibility: ContentItem["visibility"];
  status: ContentItem["status"];
  details: Prisma.JsonValue | null;
  publishedAt: string | null;
  eventStart: string | null;
  eventEnd: string | null;
  expiresAt: string | null;
  location: string | null;
  pinned: boolean;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: AttachmentData[];
};
type Manifest = {
  version: number;
  author: { email: string; name: string | null };
  items: ItemData[];
};

const prisma = new PrismaClient();
const directory = process.argv[2] ? resolve(process.argv[2]) : "";
const BUCKET = process.env.S3_BUCKET ?? "hub-files";
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

if (!directory) {
  console.error("วิธีใช้: node --env-file=.env --import tsx prisma/seed-my-items.ts <export-folder>");
  process.exit(2);
}

function date(value: string | null): Date | null {
  if (value === null) return null;
  const d = new Date(value);
  if (Number.isNaN(d.valueOf())) throw new Error(`วันเวลาไม่ถูกต้อง: ${value}`);
  return d;
}

function orderByParent(items: ItemData[]): ItemData[] {
  const map = new Map(items.map((i) => [i.id, i]));
  if (map.size !== items.length) throw new Error("พบ item id ซ้ำใน manifest");
  const active = new Set<string>();
  const visited = new Set<string>();
  const result: ItemData[] = [];
  function visit(item: ItemData) {
    if (visited.has(item.id)) return;
    if (active.has(item.id)) throw new Error(`พบการอ้างอิง parent เป็นวง: ${item.id}`);
    active.add(item.id);
    if (item.parentId && map.has(item.parentId)) visit(map.get(item.parentId)!);
    active.delete(item.id);
    visited.add(item.id);
    result.push(item);
  }
  for (const item of items) visit(item);
  return result;
}

async function existingObjectMatches(
  s3: S3Client,
  key: string,
  sha256: string,
): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (error: unknown) {
    const e = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.name === "NotFound" || e.name === "NoSuchKey" || e.$metadata?.httpStatusCode === 404) return false;
    throw error;
  }
  const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  if (!response.Body) throw new Error(`อ่าน Object เดิมไม่ได้: ${key}`);
  const bytes = Buffer.from(await response.Body.transformToByteArray());
  if (createHash("sha256").update(bytes).digest("hex") !== sha256) {
    throw new Error(`storageKey ${key} มีไฟล์อยู่แล้ว แต่เนื้อหาต่างกัน — หยุดเพื่อป้องกันการเขียนทับ`);
  }
  return true;
}

async function main() {
  const manifest = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8")) as Manifest;
  if (manifest.version !== 1 || !Array.isArray(manifest.items) ||
      !manifest.author?.email) {
    throw new Error("รูปแบบ manifest.json ไม่ถูกต้อง");
  }
  const authorEmail = manifest.author.email.trim().toLowerCase();
  const items = orderByParent(manifest.items);
  const ids = new Set(items.map((item) => item.id));
  const externalParents = [...new Set(items.map((i) => i.parentId).filter((x): x is string => !!x && !ids.has(x)))];

  // Validate all files and their hashes *before* touching the database.
  const attachmentIds = new Set<string>();
  for (const item of items) {
    if (!item.id || !item.title || typeof item.body !== "string" || !Array.isArray(item.attachments)) {
      throw new Error(`รายการใน manifest ไม่สมบูรณ์: ${item.id}`);
    }
    for (const att of item.attachments) {
      if (att.itemId !== item.id || !att.id || att.localFile !== `files/${att.id}`) {
        throw new Error(`ไฟล์ใน manifest ไม่ตรงกับประกาศ: ${item.id}`);
      }
      const bytes = await readFile(join(directory, att.localFile));
      if (bytes.length > MAX_ATTACHMENT_BYTES || bytes.length !== att.size) {
        throw new Error(`ขนาดไฟล์แนบไม่ตรง: ${att.fileName}`);
      }
      if (createHash("sha256").update(bytes).digest("hex") !== att.sha256) {
        throw new Error(`SHA256 ของไฟล์แนบไม่ตรง: ${att.fileName}`);
      }
      if (attachmentIds.has(att.id)) throw new Error(`attachment id ซ้ำ: ${att.id}`);
      attachmentIds.add(att.id);
    }
  }

  for (const parentId of externalParents) {
    if (!await prisma.contentItem.findUnique({ where: { id: parentId }, select: { id: true } })) {
      throw new Error(
        `ประกาศอัปเดตอ้างถึง parentId=${parentId} ที่ไม่มีใน seed และไม่มีใน DB ปลายทาง\n` +
        "เพื่อไม่ให้ความสัมพันธ์เธรดหาย ต้องนำเข้าประกาศหลักก่อน",
      );
    }
  }
  for (const item of items) {
    const existing = await prisma.contentItem.findUnique({
      where: { id: item.id },
      select: { author: { select: { email: true } } },
    });
    if (existing && existing.author.email.toLowerCase() !== authorEmail) {
      throw new Error(`ID ${item.id} มีอยู่แล้วแต่เป็นของบัญชีอื่น — ไม่เขียนทับ`);
    }
    for (const att of item.attachments) {
      const old = await prisma.attachment.findUnique({ where: { id: att.id } });
      if (old && (old.itemId !== item.id || old.storageKey !== att.storageKey)) {
        throw new Error(`Attachment ID ${att.id} ชนข้อมูลในฐานข้อมูลปลายทาง — ไม่เขียนทับ`);
      }
    }
  }

  const fileCount = attachmentIds.size;
  if (fileCount && (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY)) {
    throw new Error("ต้องตั้ง S3_ACCESS_KEY และ S3_SECRET_KEY ของที่เก็บไฟล์ปลายทาง");
  }
  const s3 = new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "",
    },
  });

  let created = 0;
  let already = 0;
  let uploaded = 0;
  const author = await prisma.user.upsert({
    where: { email: authorEmail },
    update: {},
    create: {
      email: authorEmail,
      name: manifest.author.name,
      role: "READER", // Do not grant EDITOR/ADMIN merely because a seed file says so.
    },
  });

  for (const item of items) {
    const present = await prisma.contentItem.findUnique({ where: { id: item.id }, select: { id: true } });
    if (!present) {
      await prisma.$transaction(async (tx) => {
        await tx.contentItem.create({
          data: {
            id: item.id,
            authorId: author.id,
            parentId: item.parentId,
            title: item.title,
            body: item.body,
            type: item.type,
            audience: item.audience,
            targetYear: item.targetYear,
            visibility: item.visibility,
            status: item.status,
            details: item.details === null ? Prisma.DbNull : item.details as Prisma.InputJsonValue,
            publishedAt: date(item.publishedAt),
            eventStart: date(item.eventStart),
            eventEnd: date(item.eventEnd),
            expiresAt: date(item.expiresAt),
            location: item.location,
            pinned: item.pinned,
            createdAt: date(item.createdAt)!,
            updatedAt: date(item.updatedAt)!,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: author.id,
            itemId: item.id,
            action: "CREATE",
            detail: "Imported from local seed (historical content); original audit history not copied",
          },
        });
      });
      created++;
    } else {
      already++;
    }

    for (const att of item.attachments) {
      const exists = await prisma.attachment.findUnique({ where: { id: att.id } });
      if (exists) continue;

      if (!await existingObjectMatches(s3, att.storageKey, att.sha256)) {
        const bytes = await readFile(join(directory, att.localFile));
        if (bytes.length !== att.size || createHash("sha256").update(bytes).digest("hex") !== att.sha256) {
          throw new Error(`ไฟล์แนบถูกเปลี่ยนระหว่าง Import: ${att.fileName}`);
        }
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: att.storageKey,
          Body: bytes,
          ContentType: att.mimeType,
        }));
        uploaded++;
      }
      await prisma.attachment.create({
        data: {
          id: att.id,
          itemId: item.id,
          fileName: att.fileName,
          mimeType: att.mimeType,
          size: att.size,
          storageKey: att.storageKey,
          createdAt: date(att.createdAt)!,
        },
      });
    }
  }
  console.log(`✅ Seed นำเข้าสำเร็จ: สร้าง ${created} ประกาศ/อัปเดต, ข้ามของเดิม ${already}, อัปโหลดไฟล์ ${uploaded}/${fileCount}`);
  console.log("✅ ไม่ลบข้อมูลเดิม และไม่เปลี่ยน role หรือเซฟของผู้ใช้งาน");
  console.log("ℹ️ หากเป็นฐานข้อมูลใหม่ ต้องให้ Admin กำหนดสิทธิ์ EDITOR ของบัญชีเจ้าของก่อนแก้ประกาศผ่านเว็บ");
}

main()
  .catch((error) => {
    console.error("❌ Import ล้มเหลว:", error instanceof Error ? error.message : error);
    console.error("สามารถแก้ปัญหาแล้วรันซ้ำได้โดยไม่ลบหรือเขียนทับรายการที่มีอยู่");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
