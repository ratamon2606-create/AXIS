import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { signedDownloadUrl } from "@/lib/s3";

/**
 * ดาวน์โหลดไฟล์แนบ · เจ้าของไฟล์คือ Thanakorn (US-6)
 *
 * SRS-7 ตรวจสิทธิ์ก่อนออกลิงก์ และลิงก์หมดอายุใน 5 นาที
 * SRS-8 ไฟล์ของประกาศที่จำกัดต้องเข้าไม่ได้เมื่อไม่มี session
 *       ไม่ว่าจะได้ที่อยู่มาอย่างไร
 *
 * เส้นทางนี้ไม่ได้ส่งไฟล์เอง แต่ออกลิงก์ชั่วคราวแล้วให้เบราว์เซอร์ไปโหลดตรง
 * เซิร์ฟเวอร์จึงไม่ต้องอ่านไฟล์ทั้งก้อนเข้าหน่วยความจำ
 *
 * คืน 404 ทุกกรณีที่ไม่มีสิทธิ์ ไม่ใช่ 403
 * เพราะการบอกว่าไฟล์นี้มีอยู่แต่คุณเข้าไม่ได้ ก็คือการเปิดเผยว่ามันมีอยู่
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const attachment = await db.attachment.findUnique({
    where: { id },
    include: { item: true },
  });

  if (!attachment) return new NextResponse("Not found", { status: 404 });

  const item = attachment.item;

  // ไฟล์สืบทอดกฎการมองเห็นจากประกาศที่มันแนบอยู่
  // ร่างและของที่ซ่อนถาวรก็ต้องโหลดไม่ได้เช่นกัน
  if (item.status === "DRAFT" || item.status === "HIDDEN") {
    return new NextResponse("Not found", { status: 404 });
  }

  if (item.visibility === "KU_ONLY") {
    const session = await auth().catch(() => null);
    if (!session?.user) return new NextResponse("Not found", { status: 404 });
  }

  const url = await signedDownloadUrl(attachment.storageKey, attachment.fileName);

  // ไม่ให้แคช เพราะลิงก์ที่ออกไปหมดอายุใน 5 นาที
  // ถ้าปล่อยให้แคช ผู้ใช้จะได้ลิงก์เก่าที่ใช้ไม่ได้แล้ว
  return NextResponse.redirect(url, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
