import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { AUDIENCE_LABEL, visibleWhere, TYPE_LABEL } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function PastPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; page?: string }>;
}) {
  const { year, page: rawPage } = await searchParams;
  const parsedPage = Number(rawPage ?? "1");
  const page = Number.isSafeInteger(parsedPage) && parsedPage >= 1 ? Math.min(parsedPage, 10_000) : 1;
  const PAGE_SIZE = 30;
  const session = await auth();
  const signedIn = !!session?.user;

  const where = visibleWhere(signedIn, "past");

  const startYear = year && /^\d{4}$/.test(year) ? Number(year) - 543 : null;
  const period = startYear && startYear >= 2000 && startYear <= 2100
    ? { gte: new Date(`${startYear}-01-01T00:00:00+07:00`), lt: new Date(`${startYear + 1}-01-01T00:00:00+07:00`) }
    : null;
  // Existing schema has no endedAt; use the deadline for automatic expiry,
  // and updatedAt as the best available date for manually concluded items.
  const yearFilter = period ? { OR: [
    { status: "PAST" as const, updatedAt: period },
    { status: "PUBLISHED" as const, expiresAt: period },
  ] } : {};

  const fetchedItems = await db.contentItem.findMany({
    where: { AND: [where, yearFilter] },
    orderBy: { expiresAt: "desc" },
    include: { _count: { select: { children: { where: { status: "PUBLISHED", ...(signedIn ? {} : { visibility: "PUBLIC" }) } } } } },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
  });
  const hasNext = fetchedItems.length > PAGE_SIZE;
  const items = fetchedItems.slice(0, PAGE_SIZE);

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
        <ul className="axis-auto-grid-wide">
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
                    {TYPE_LABEL[item.type]} · {AUDIENCE_LABEL[item.audience]}
                  </span>
                  <h3 className="mt-1.5 text-sm font-medium leading-snug">{item.title}</h3>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {(page > 1 || hasNext) && <nav aria-label="หน้าคลังย้อนหลัง" className="flex items-center justify-center gap-3 text-sm">
        {page > 1 && <Link href={`/past?${new URLSearchParams({ ...(year ? { year } : {}), page: String(page - 1) })}`} className="rounded-xl border border-line bg-paper px-4 py-2">← ก่อนหน้า</Link>}
        <span className="text-muted">หน้า {page}</span>
        {hasNext && <Link href={`/past?${new URLSearchParams({ ...(year ? { year } : {}), page: String(page + 1) })}`} className="rounded-xl border border-line bg-paper px-4 py-2">ถัดไป →</Link>}
      </nav>}
    </div>
  );
}
