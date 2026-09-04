import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // ล้างของเก่าก่อน เพื่อให้รันซ้ำได้เรื่อย ๆ
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

  // ใส่อีเมลของทีมไว้ล่วงหน้า พอล็อกอินครั้งแรกจะได้สิทธิ์ทันที
  await db.allowlist.createMany({
    data: [
      { email: "jehan.t@ku.th", role: "ADMIN", note: "สมาชิกทีม" },
      { email: "thanakorn.i@ku.th", role: "EDITOR", note: "สมาชิกทีม" },
      { email: "piyatida.m@ku.th", role: "EDITOR", note: "สมาชิกทีม" },
      { email: "ratamon.c@ku.th", role: "EDITOR", note: "สมาชิกทีม" },
    ],
  });

  const base = { authorId: editor.id, status: "PUBLISHED" as const };

  // 1 · แจ้งเตือน
  await db.contentItem.create({
    data: {
      ...base,
      title: "ปิดพื้นที่ตึกคอมชั่วคราว",
      body: "ภาควิชาจะดำเนินการเชื่อมเหล็กและรื้อราวกันตกชั้น 2 รวมถึงปิดกั้นทางเดินใต้ตึกชั้น 1 เพื่อความปลอดภัยจากวัสดุตกหล่น",
      type: "ALERT",
      department: "CPE",
      visibility: "KU_ONLY",
      details: {
        when: "22 ส.ค. 08:00 – 24 ส.ค. 20:00",
        where: "อาคาร 15 ทางเดินใต้ตึกชั้น 1",
        note: "ใช้เส้นทางเลี่ยงตามผัง",
      },
      eventStart: new Date("2026-08-22T08:00:00+07:00"),
      expiresAt: new Date("2026-08-24T20:00:00+07:00"),
    },
  });

  // 2 · โอกาส
  await db.contentItem.create({
    data: {
      ...base,
      title: "รับสมัครนิสิตช่วยงาน Open House 2569",
      body: "ภาควิชาเปิดรับนิสิตช่วยงาน Open House จำนวน 20 คน ปฏิบัติงานประจำซุ้มแนะนำหลักสูตร มีอาหารกลางวันและเกียรติบัตร",
      type: "OPPORTUNITY",
      department: "SKE",
      visibility: "KU_ONLY",
      details: {
        deadline: "10 ก.ย. 2569",
        qualification: "SKE ชั้นปี 2–3 สะดวกเข้าร่วมทั้งสองวัน",
        reward: "เกียรติบัตรและอาหารกลางวัน",
      },
      eventStart: new Date("2026-09-15T13:00:00+07:00"),
      expiresAt: new Date("2026-09-10T23:59:00+07:00"),
    },
  });

  // 3 · กิจกรรม พร้อมโพสต์ต่อในเธรด
  const hpcnc = await db.contentItem.create({
    data: {
      ...base,
      title: "HPCNC Sharing Day 2026",
      body: "งานแบ่งปันความรู้ด้าน high performance computing จากห้องปฏิบัติการ HPCNC",
      type: "ACTIVITY",
      department: "CPE",
      visibility: "KU_ONLY",
      details: {
        when: "อา. 12 ก.ย. 09:00–16:00",
        where: "ห้อง s603 อาคาร 11",
        who: "CPE และ SKE ทุกชั้นปี",
      },
      eventStart: new Date("2026-09-12T09:00:00+07:00"),
      expiresAt: new Date("2026-09-12T16:00:00+07:00"),
    },
  });

  await db.contentItem.create({
    data: {
      ...base,
      parentId: hpcnc.id,
      title: "เปลี่ยนห้องเป็น s603",
      body: "โปสเตอร์เดิมระบุห้อง s601 ซึ่งผิด ห้องที่ถูกต้องคือ s603 ขออภัยในความสับสน",
      type: "ACTIVITY",
      department: "CPE",
      visibility: "KU_ONLY",
    },
  });

  // 4 · ข่าวสาร
  await db.contentItem.create({
    data: {
      ...base,
      title: "เปลี่ยนห้องบรรยาย 01204322 เป็นห้อง 401",
      body: "เนื่องจากห้องเดิมปรับปรุงระบบปรับอากาศ มีผลตั้งแต่สัปดาห์หน้าเป็นต้นไป",
      type: "NEWS",
      department: "SKE",
      visibility: "KU_ONLY",
      details: {
        effective: "สัปดาห์หน้าเป็นต้นไป",
        detail: "ห้องใหม่ 401 อาคาร 15",
      },
    },
  });

  // 5 · เอกสาร ไม่มีวันหมดเขต
  await db.contentItem.create({
    data: {
      ...base,
      title: "รายชื่อห้องปฏิบัติการและอาจารย์ที่ปรึกษา",
      body: "อ.ปิยะ (ML & AI) · HPCNC (อ.จันทนา อ.ชวณัฐ อ.กัญจสิทธิ์) · อ.ยอดเยี่ยม (computational finance) · อ.ภารุจ (performance, security, blockchain) · อ.ศิริศิลป์ (HCI, VR)",
      type: "DOCUMENT",
      department: "CPE",
      visibility: "PUBLIC",
      details: { kind: "ข้อมูลอ้างอิง ไม่มีวันหมดอายุ" },
    },
  });

  // 6 · โอกาส แบบสาธารณะ ใช้ทดสอบว่าคนนอกเห็น
  await db.contentItem.create({
    data: {
      ...base,
      title: "ประกวดตราสัญลักษณ์ KU84",
      body: "มหาวิทยาลัยเชิญชวนนักเรียน นิสิต ศิษย์เก่า และประชาชนทั่วไป ร่วมส่งผลงานประกวดออกแบบตราสัญลักษณ์ครบรอบ 84 ปี",
      type: "OPPORTUNITY",
      department: "CPE",
      visibility: "PUBLIC",
      details: {
        deadline: "20 ก.ย. 2569 23:59",
        qualification: "นิสิต ศิษย์เก่า และบุคคลทั่วไป",
        reward: "เงินรางวัลรวม 80,000 บาท",
      },
      expiresAt: new Date("2026-09-20T23:59:00+07:00"),
    },
  });

  const total = await db.contentItem.count();
  console.log(`seed เสร็จแล้ว · ประกาศทั้งหมด ${total} รายการ`);
  console.log("สาธารณะ 2 · เฉพาะ KU 4 (นับโพสต์ต่อในเธรดด้วย)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
