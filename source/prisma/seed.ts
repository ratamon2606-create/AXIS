import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.savedItem.deleteMany();
  await db.auditLog.deleteMany();
  await db.attachment.deleteMany();
  await db.contentItem.deleteMany();
  await db.allowlist.deleteMany();
  await db.user.deleteMany();

  const editor = await db.user.create({
    data: { email: "seed.editor@ku.th", name: "ผู้เขียนตัวอย่าง", role: "EDITOR", program: "CPE", year: 4 },
  });
  const reader = await db.user.create({
    data: { email: "seed.reader@ku.th", name: "นิสิตตัวอย่าง", role: "READER", program: "SKE", year: 2 },
  });

  await db.allowlist.createMany({
    data: [
      { email: "jehan.t@ku.th", role: "ADMIN", note: "สมาชิกทีม" },
      { email: "thanakorn.i@ku.th", role: "EDITOR", note: "สมาชิกทีม" },
      { email: "piyatida.m@ku.th", role: "EDITOR", note: "สมาชิกทีม" },
      { email: "ratamon.c@ku.th", role: "EDITOR", note: "สมาชิกทีม" },
    ],
  });

  const day = 86_400_000;
  const inDays = (n: number) => new Date(Date.now() + n * day);
  const base = { authorId: editor.id, status: "PUBLISHED" as const, publishedAt: new Date() };

  const alert = await db.contentItem.create({
    data: {
      ...base,
      title: "ปิดพื้นที่ตึกคอมชั่วคราว",
      body: "ภาควิชาจะดำเนินการเชื่อมเหล็กและรื้อราวกันตกชั้น 2 รวมถึงปิดกั้นทางเดินใต้ตึกชั้น 1",
      type: "ALERT",
      audience: "CPE_SKE",
      visibility: "KU_ONLY",
      location: "อาคาร 15",
      expiresAt: inDays(3),
      pinned: true,
    },
  });

  await db.contentItem.create({
    data: {
      ...base,
      title: "รับสมัครนิสิตช่วยงาน Open House 2569",
      body: "เปิดรับนิสิตช่วยงาน 20 คน มีอาหารกลางวันและเกียรติบัตร",
      type: "OPPORTUNITY",
      audience: "SKE",
      targetYear: 2,
      details: { qualification: "SKE ปี 2–3", reward: "เกียรติบัตรและอาหารกลางวัน" },
      eventStart: inDays(14),
      expiresAt: inDays(10),
    },
  });

  const hpcnc = await db.contentItem.create({
    data: {
      ...base,
      title: "HPCNC Sharing Day 2026",
      body: "งานแบ่งปันความรู้ด้าน high performance computing",
      type: "ACTIVITY",
      audience: "CPE_SKE",
      location: "ห้อง S603 อาคาร 11",
      eventStart: inDays(7),
      eventEnd: new Date(inDays(7).getTime() + 7 * 60 * 60 * 1000),
      expiresAt: inDays(7),
    },
  });

  await db.contentItem.create({
    data: {
      ...base,
      parentId: hpcnc.id,
      title: "เปลี่ยนห้องเป็น S603",
      body: "โปสเตอร์เดิมระบุห้อง S601 ซึ่งผิด ห้องที่ถูกต้องคือ S603",
      type: "ACTIVITY",
      audience: "CPE_SKE",
      visibility: "KU_ONLY",
    },
  });

  await db.contentItem.create({
    data: {
      ...base,
      title: "รายชื่อห้องปฏิบัติการและอาจารย์ที่ปรึกษา",
      body: "ข้อมูลอ้างอิงของห้องปฏิบัติการและอาจารย์ที่ปรึกษา",
      type: "DOCUMENT",
      audience: "ALL",
      visibility: "PUBLIC",
      details: { kind: "ข้อมูลอ้างอิง" },
    },
  });

  const contest = await db.contentItem.create({
    data: {
      ...base,
      title: "ประกวดตราสัญลักษณ์ KU84",
      body: "เชิญนิสิต ศิษย์เก่า และบุคคลทั่วไปส่งผลงาน",
      type: "OPPORTUNITY",
      audience: "ALL",
      visibility: "PUBLIC",
      expiresAt: inDays(20),
    },
  });

  await db.contentItem.create({
    data: {
      ...base,
      title: "KAMP Engineering รุ่นที่ 6",
      body: "กิจกรรมพัฒนาทักษะวิศวกรรมสำหรับนิสิตชั้นปีที่ 1 และ 2",
      type: "ACTIVITY",
      audience: "CPE_SKE",
      targetYear: 2,
      location: "ห้อง 5404 อาคาร 5",
      eventStart: inDays(-20),
      expiresAt: inDays(-20),
    },
  });

  await db.contentItem.create({
    data: {
      ...base,
      status: "PAST",
      title: "รับสมัคร TA วิชา 01204111",
      body: "ปิดรับก่อนกำหนดเพราะได้ผู้สมัครครบแล้ว",
      type: "OPPORTUNITY",
      audience: "CPE",
      targetYear: 3,
      expiresAt: inDays(15),
    },
  });

  await db.contentItem.create({
    data: {
      ...base,
      status: "HIDDEN",
      title: "ประกาศทดสอบระบบ ห้ามเผยแพร่",
      body: "รายการนี้ต้องไม่ปรากฏต่อผู้อ่าน",
      type: "NEWS",
      audience: "CPE",
    },
  });

  await db.savedItem.create({ data: { userId: reader.id, itemId: contest.id } });
  await db.savedItem.create({ data: { userId: reader.id, itemId: alert.id } });

  console.log("Iteration 3 seed ready");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
