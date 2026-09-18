import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { visibleWhere, TYPE_LABEL } from "@/lib/items";

export const dynamic = "force-dynamic";

/**
 * แท็บของที่จบแล้ว · เจ้าของไฟล์คือ Jehan (US-7)
 *
 * SRS-18 ของที่พ้นวันหมดเขตออกจากฟีดปัจจุบัน แต่ยังค้นหาและเปิดดูได้
 *
 * หน้านี้ไม่ได้เขียนกฎการมองเห็นใหม่ ใช้ visibleWhere ตัวเดิม
 * เปลี่ยนแค่ scope จาก current เป็น past
 * ของที่ซ่อนถาวรจึงไม่โผล่ที่นี่โดยอัตโนมัติ เพราะกฎนั้นอยู่ในฟังก์ชันเดียวกัน
 */
export default async function PastPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year } = await searchParams;
  const session = await auth();
  const signedIn = !!session?.user;

  const where = visibleWhere(signedIn, "past");

  const yearFilter =
    year && /^\d{4}$/.test(year)
      ? {
          createdAt: {
            gte: new Date(`${Number(year) - 543}-01-01`),
            lt: new Date(`${Number(year) - 543 + 1}-01-01`),
          },
        }
      : {};

  const items = await db.contentItem.findMany({
    where: { ...where, ...yearFilter },
    orderBy: { expiresAt: "desc" },
    include: { _count: { select: { children: true } } },
    take: 50,
  });

  const thisYearBE = new Date().getFullYear() + 543;
  const years = [thisYearBE, thisYearBE - 1];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-brandsoft px-4 py-3 text-sm leading-6 text-branddeep">
        คลังของภาควิชา ประกาศที่จบแล้วยังอยู่ที่นี่และค้นหาเจอ
        หลายรายการมีบันทึกหลังงานอยู่ในเธรด
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/past"
          className={`rounded-full border px-3 py-1 text-xs ${
            !year ? "border-brand bg-brandsoft font-medium text-branddeep" : "border-line bg-paper text-muted"
          }`}
        >
          ทั้งหมด
        </Link>
        {years.map((y) => (
          <Link
            key={y}
            href={`/past?year=${y}`}
            className={`rounded-full border px-3 py-1 text-xs ${
              year === String(y)
                ? "border-brand bg-brandsoft font-medium text-branddeep"
                : "border-line bg-paper text-muted"
            }`}
          >
            {y}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          ยังไม่มีประกาศที่จบแล้วในช่วงนี้
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/items/${item.id}`}
                className="block overflow-hidden rounded-2xl bg-paper shadow-sm ring-1 ring-line/60"
              >
                <p className="bg-wash px-3 py-1.5 text-[11px] text-muted">
                  จบไปแล้ว
                  {item.expiresAt &&
                    ` เมื่อ ${new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(item.expiresAt)}`}
                  {item._count.children > 0 && ` · มีบันทึกในเธรด ${item._count.children} รายการ`}
                </p>
                <div className="p-3">
                  <span className="rounded bg-wash px-1.5 py-0.5 text-[10px] text-muted">
                    {TYPE_LABEL[item.type]} · {item.department}
                  </span>
                  <h3 className="mt-1.5 text-sm font-medium leading-snug">{item.title}</h3>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
