import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AUDIENCE_LABEL, TYPE_LABEL, visibleWhere } from "@/lib/items";
import type { ItemType, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  type?: string;
  program?: string;
  year?: string;
  past?: string;
  selected?: string;
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const session = await auth().catch(() => null);
  const q = params.q?.trim() ?? "";
  const includePast = params.past === "1";

  const conditions: Prisma.ContentItemWhereInput[] = [
    visibleWhere(!!session?.user, includePast ? "all" : "current"),
  ];

  if (params.type && params.type !== "ALL") conditions.push({ type: params.type as ItemType });
  if (params.program === "CPE") {
    conditions.push({ audience: { in: ["ALL", "CPE", "CPE_SKE"] } });
  } else if (params.program === "SKE") {
    conditions.push({ audience: { in: ["ALL", "SKE", "CPE_SKE"] } });
  }

  if (params.year) {
    const year = Number(params.year);
    if (Number.isInteger(year)) conditions.push({ OR: [{ targetYear: null }, { targetYear: year }] });
  }

  if (q) {
    conditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const results = await db.contentItem.findMany({
    where: { AND: conditions },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  const selected = results.find((item) => item.id === params.selected) ?? results[0] ?? null;
  const base = new URLSearchParams();
  if (q) base.set("q", q);
  if (params.type) base.set("type", params.type);
  if (params.program) base.set("program", params.program);
  if (params.year) base.set("year", params.year);
  if (includePast) base.set("past", "1");

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">Search</p>
        <h1 className="mt-1 text-xl">ค้นหาประกาศ</h1>
      </div>

      <form className="grid gap-2 rounded-2xl bg-paper p-3 ring-1 ring-line/60 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" defaultValue={q} placeholder="ค้นหาหัวข้อหรือเนื้อหา" className="rounded-xl border border-line px-3 py-2 text-sm lg:col-span-2" />
        <select name="type" defaultValue={params.type ?? "ALL"} className="rounded-xl border border-line px-3 py-2 text-sm">
          <option value="ALL">ทุกประเภท</option>
          {Object.entries(TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select name="program" defaultValue={params.program ?? "ALL"} className="rounded-xl border border-line px-3 py-2 text-sm">
          <option value="ALL">ทุกหลักสูตร</option>
          <option value="CPE">CPE</option>
          <option value="SKE">SKE</option>
        </select>
        <select name="year" defaultValue={params.year ?? ""} className="rounded-xl border border-line px-3 py-2 text-sm">
          <option value="">ทุกชั้นปี</option>
          {[1, 2, 3, 4].map((year) => <option key={year} value={year}>ปี {year}</option>)}
        </select>
        <button className="rounded-xl bg-brand px-4 py-2 text-sm text-white">ค้นหา</button>
        <label className="flex items-center gap-2 text-xs text-muted lg:col-span-6">
          <input type="checkbox" name="past" value="1" defaultChecked={includePast} /> รวมประกาศที่ผ่านมาแล้ว
        </label>
      </form>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.25fr]">
        <section className="space-y-2">
          <p className="text-xs text-muted">พบ {results.length} รายการ</p>
          {results.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">ไม่พบประกาศที่ตรงกับตัวกรอง</p>}
          {results.map((item) => {
            const next = new URLSearchParams(base);
            next.set("selected", item.id);
            return (
              <Link key={item.id} href={`/search?${next.toString()}`} className={`block rounded-2xl bg-paper p-3 ring-1 ${selected?.id === item.id ? "ring-2 ring-brand" : "ring-line/60"}`}>
                <div className="flex flex-wrap gap-1 text-[10px] text-muted">
                  <span>{TYPE_LABEL[item.type]}</span><span>·</span><span>{AUDIENCE_LABEL[item.audience]}</span>
                  {item.status === "PAST" || (item.expiresAt && item.expiresAt < new Date()) ? <><span>·</span><span>สิ้นสุดแล้ว</span></> : null}
                </div>
                <h2 className="mt-1 text-sm font-medium">{item.title}</h2>
              </Link>
            );
          })}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {selected ? (
            <div className="rounded-3xl bg-paper p-5 ring-1 ring-line/60">
              <p className="text-xs text-muted">{TYPE_LABEL[selected.type]} · {AUDIENCE_LABEL[selected.audience]}</p>
              <h2 className="mt-1 text-xl">{selected.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{selected.body}</p>
              {selected.location && <p className="mt-3 text-xs text-muted">📍 {selected.location}</p>}
              <Link href={`/items/${selected.id}`} className="mt-5 inline-flex rounded-xl bg-brand px-4 py-2 text-sm text-white">เปิดประกาศ →</Link>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">เลือกรายการเพื่อดูตัวอย่าง</div>
          )}
        </aside>
      </div>
    </div>
  );
}
