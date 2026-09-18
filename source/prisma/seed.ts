import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/**
 * ข้อมูลตั้งต้นของ iteration 2
 *
 * เพิ่มจาก iteration 1 สามอย่าง
 *   1. รายการที่พ้นวันหมดเขตไปแล้ว เพื่อให้ทดสอบแท็บของที่จบแล้วได้ทันที
 *   2. รายการที่ผู้เขียนกดให้จบเอง แม้ยังไม่ถึงวัน
 *   3. รายการที่ถูกซ่อนถาวร เพื่อให้เห็นว่ามันต่างจากการจบตามกำหนด
 *
 * ถ้าไม่มีสามอย่างนี้ คนทำวงจรหมดเขตจะต้องนั่งสร้างข้อมูลเองทุกครั้งที่ทดสอบ
 */
async function main() {
  await db.auditLog.deleteMany();
  await db.attachment.deleteMany();
  await db.contentItem.deleteMany();
  await db.allowlist.deleteMany();
  await db.user.deleteMany();

  const editor = await db.user.create({
    data: {
      email: "seed.editor@ku.th",
      name: "ผู้เขียนตัวอย่าง",
      role: "EDITOR",
      department: "CPE",
      year: 4,
    },
  });

  await db.allowlist.createMany({
    data: [
      { email: "jehan.t@ku.th", role: "ADMIN", note: "สมาชิกทีม" },
      { email: "thanakorn.i@ku.th", role: "EDITOR", note: "สมาชิกทีม" },
      { email: "piyatida.m@ku.th", role: "EDITOR", note: "สมาชิกทีม" },
      { email: "ratamon.c@ku.th", role: "EDITOR", note: "สมาชิกทีม" },
    ],
  });

  const base = { authorId: editor.id, status: "PUBLISHED" as const };
  const day = 86_400_000;
  const inDays = (n: number) => new Date(Date.now() + n * day);

  /* ---------- ยังเปิดอยู่ ---------- */

  await db.contentItem.create({
    data: {
      ...base,
      title: "ปิดพื้นที่ตึกคอมชั่วคราว",
      body: "ภาควิชาจะดำเนินการเชื่อมเหล็กและรื้อราวกันตกชั้น 2 รวมถึงปิดกั้นทางเดินใต้ตึกชั้น 1",
      type: "ALERT",
      department: "CPE",
      details: {
        when: "22 ส.ค. 08:00 – 24 ส.ค. 20:00",
        where: "อาคาร 15 ทางเดินใต้ตึกชั้น 1",
        note: "ใช้เส้นทางเลี่ยงตามผัง",
      },
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
      department: "SKE",
      details: {
        deadline: "อีก 10 วัน",
        qualification: "SKE ชั้นปี 2–3",
        reward: "เกียรติบัตรและอาหารกลางวัน",
      },
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
      department: "CPE",
      details: {
        when: "อีก 7 วัน 09:00–16:00",
        where: "ห้อง s603 อาคาร 11",
        who: "CPE และ SKE ทุกชั้นปี",
      },
      eventStart: inDays(7),
      expiresAt: inDays(7),
    },
  });

  await db.contentItem.create({
    data: {
      ...base,
      parentId: hpcnc.id,
      title: "เปลี่ยนห้องเป็น s603",
      body: "โปสเตอร์เดิมระบุห้อง s601 ซึ่งผิด ห้องที่ถูกต้องคือ s603",
      type: "ACTIVITY",
      department: "CPE",
    },
  });

  /* ---------- ไม่มีวันหมดเขต ทดสอบ SRS-26 ---------- */

  await db.contentItem.create({
    data: {
      ...base,
      title: "รายชื่อห้องปฏิบัติการและอาจารย์ที่ปรึกษา",
      body: "อ.ปิยะ (ML & AI) · HPCNC · อ.ยอดเยี่ยม (computational finance) · อ.ภารุจ (security) · อ.ศิริศิลป์ (HCI, VR)",
      type: "DOCUMENT",
      department: "CPE",
      visibility: "PUBLIC",
      details: { kind: "ข้อมูลอ้างอิง ไม่มีวันหมดอายุ" },
    },
  });

  await db.contentItem.create({
    data: {
      ...base,
      title: "ประกวดตราสัญลักษณ์ KU84",
      body: "เชิญนักเรียน นิสิต ศิษย์เก่า และประชาชนทั่วไป ร่วมส่งผลงาน",
      type: "OPPORTUNITY",
      department: "CPE",
      visibility: "PUBLIC",
      details: {
        deadline: "อีก 20 วัน",
        qualification: "นิสิต ศิษย์เก่า และบุคคลทั่วไป",
        reward: "เงินรางวัลรวม 80,000 บาท",
      },
      expiresAt: inDays(20),
    },
  });

  /* ---------- จบแล้วตามกำหนด ทดสอบ SRS-18 ---------- */

  const kamp = await db.contentItem.create({
    data: {
      ...base,
      title: "KAMP Engineering รุ่นที่ 6",
      body: "กิจกรรมพัฒนาทักษะวิศวกรรมสำหรับนิสิตชั้นปีที่ 1 และ 2",
      type: "ACTIVITY",
      department: "CPE",
      details: {
        when: "ผ่านไปแล้ว 17:00–20:30",
        where: "ห้อง 5404 อาคาร 5",
        who: "ปี 1 และ 2",
      },
      eventStart: inDays(-20),
      expiresAt: inDays(-20),
    },
  });

  await db.contentItem.create({
    data: {
      ...base,
      parentId: kamp.id,
      title: "สรุปงานและคำขอบคุณ",
      body: "ขอบคุณผู้เข้าร่วมกว่า 120 คน แล้วพบกันรุ่นที่ 7",
      type: "ACTIVITY",
      department: "CPE",
    },
  });

  /* ---------- ผู้เขียนกดให้จบเอง ทดสอบ SRS-24 ---------- */

  await db.contentItem.create({
    data: {
      ...base,
      status: "PAST",
      title: "รับสมัคร TA วิชา 01204111",
      body: "ปิดรับก่อนกำหนดเพราะได้ผู้สมัครครบแล้ว",
      type: "OPPORTUNITY",
      department: "CPE",
      details: {
        deadline: "ปิดรับก่อนกำหนด",
        qualification: "ปี 3 ขึ้นไป",
        reward: "ค่าตอบแทนรายชั่วโมง",
      },
      expiresAt: inDays(15), // ยังไม่ถึงวัน แต่สถานะเป็นจบแล้ว
    },
  });

  /* ---------- ซ่อนถาวร ทดสอบ SRS-20 ---------- */

  await db.contentItem.create({
    data: {
      ...base,
      status: "HIDDEN",
      title: "ประกาศทดสอบระบบ ห้ามเผยแพร่",
      body: "รายการนี้ถูกซ่อนถาวร ต้องไม่ปรากฏต่อผู้อ่านทั้งในฟีด การค้นหา และแท็บของที่จบแล้ว",
      type: "NEWS",
      department: "CPE",
    },
  });

  const [total, current, past, hidden] = await Promise.all([
    db.contentItem.count(),
    db.contentItem.count({ where: { status: "PUBLISHED", parentId: null, expiresAt: { gte: new Date() } } }),
    db.contentItem.count({ where: { status: "PAST" } }),
    db.contentItem.count({ where: { status: "HIDDEN" } }),
  ]);

  console.log(`seed เสร็จแล้ว · ทั้งหมด ${total} รายการ`);
  console.log(`ยังเปิดอยู่ ${current} · กดให้จบเอง ${past} · ซ่อนถาวร ${hidden}`);
  console.log("มีรายการที่พ้นวันหมดเขตแล้ว 1 รายการ พร้อมรูปสรุปหลังงานในเธรด");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
