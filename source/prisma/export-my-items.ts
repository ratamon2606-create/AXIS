import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = (process.argv[2] ?? "").trim().toLowerCase();
const output =
  process.argv[3]
    ? resolve(process.argv[3])
    : resolve("prisma", "seeds", "exports", `my-items-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const BUCKET = process.env.S3_BUCKET ?? "hub-files";
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("วิธีใช้: node --env-file=.env --import tsx prisma/export-my-items.ts your.email@ku.th [output-directory]");
  process.exit(2);
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`ไม่พบบัญชี ${email} ใน DATABASE_URL ปัจจุบัน`);

  const items = await prisma.contentItem.findMany({
    where: { authorId: user.id },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  if (items.length === 0) throw new Error(`ไม่พบประกาศที่สร้างโดย ${email}`);

  const attachmentCount = items.reduce((n, item) => n + item.attachments.length, 0);
  if (attachmentCount && (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY)) {
    throw new Error("ต้องตั้ง S3_ACCESS_KEY และ S3_SECRET_KEY ใน .env เพื่อดึงไฟล์แนบจริงจาก MinIO");
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

  await mkdir(dirname(output), { recursive: true });
  const tmp = await mkdtemp(join(dirname(output), ".axis-export-"));
  let complete = false;
  try {
    await mkdir(join(tmp, "files"));

    const manifest = {
      version: 1,
      exportedAt: new Date().toISOString(),
      author: { email: user.email, name: user.name },
      description: "Only ContentItems authored by this account, including authored follow-ups.",
      items: [] as Array<Record<string, unknown>>,
    };
    const ids = new Set(items.map((item) => item.id));
    const externalParents = new Set<string>();

    for (const item of items) {
      if (item.parentId && !ids.has(item.parentId)) externalParents.add(item.parentId);
      const attachments = [];
      for (const attachment of item.attachments) {
        const response = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: attachment.storageKey }));
        if (!response.Body) throw new Error(`ไม่พบข้อมูลไฟล์จริง: ${attachment.storageKey}`);
        const bytes = Buffer.from(await response.Body.transformToByteArray());
        if (bytes.length > MAX_ATTACHMENT_BYTES) throw new Error(`ไฟล์เกิน 20 MB: ${attachment.fileName}`);
        if (bytes.length !== attachment.size) {
          throw new Error(`ไฟล์ ${attachment.fileName} มีขนาดจริง ${bytes.length} แต่ฐานข้อมูลระบุ ${attachment.size}`);
        }
        const relativeFile = `files/${attachment.id}`;
        await writeFile(join(tmp, relativeFile), bytes);
        attachments.push({
          id: attachment.id,
          itemId: attachment.itemId,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          storageKey: attachment.storageKey,
          createdAt: attachment.createdAt.toISOString(),
          localFile: relativeFile,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        });
      }
      manifest.items.push({
        id: item.id,
        title: item.title,
        body: item.body,
        type: item.type,
        audience: item.audience,
        targetYear: item.targetYear,
        visibility: item.visibility,
        status: item.status,
        details: item.details,
        publishedAt: item.publishedAt?.toISOString() ?? null,
        eventStart: item.eventStart?.toISOString() ?? null,
        eventEnd: item.eventEnd?.toISOString() ?? null,
        expiresAt: item.expiresAt?.toISOString() ?? null,
        location: item.location,
        pinned: item.pinned,
        parentId: item.parentId,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        attachments,
      });
    }

    await writeFile(join(tmp, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    await rename(tmp, output);
    complete = true;

    console.log(`✅ Export สำเร็จ: ${items.length} ประกาศ/อัปเดต, ${attachmentCount} ไฟล์`);
    console.log(`📁 ${output}`);
    if (externalParents.size) {
      console.warn(`⚠️ มีอัปเดต ${externalParents.size} กลุ่มที่อ้างถึงประกาศหลักของบัญชีอื่น`);
      console.warn("   เมื่อนำเข้า DB ใหม่ ต้องมีประกาศหลักเหล่านั้นอยู่ก่อน มิฉะนั้น importer จะหยุดโดยไม่เปลี่ยน parentId");
    }
    console.log("⚠️ โฟลเดอร์ export อาจมีข้อมูล KU_ONLY หรืออีเมลจริง อย่าเผยแพร่ใน public repository");
  } finally {
    if (!complete) await rm(tmp, { recursive: true, force: true });
  }
}

main()
  .catch((error) => {
    console.error("❌ Export ล้มเหลว:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
