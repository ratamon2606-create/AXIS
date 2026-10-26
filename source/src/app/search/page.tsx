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

  const conditions: Prisma.ContentItemWhereInput[] = [visibleWhere(!!session?.user, includePast ? "all" : "current")];

  if (params.type && params.type !== "ALL") conditions.push({ type: params.type as ItemType });
  if (params.program === "CPE") conditions.push({ audience: { in: ["ALL", "CPE", "CPE_SKE"] } });
  else if (params.program === "SKE") conditions.push({ audience: { in: ["ALL", "SKE", "CPE_SKE"] } });

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
  const activeFilterCount = [q, params.type && params.type !== "ALL", params.program && params.program !== "ALL", params.year, includePast].filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">ค้นหา</p>
          <h1 className="mt-1 text-2xl sm:text-3xl">ค้นหาประกาศ</h1>
          <p className="mt-1 text-sm text-muted">ค้นจากหัวข้อ/เนื้อหา</p>
        </div>
        {activeFilterCount > 0 && <Link href="/search" className="sm:ml-auto text-xs font-medium text-branddeep underline underline-offset-4">ล้างตัวกรองทั้งหมด</Link>}
      </div>

      <details className="axis-panel lg:hidden" open={activeFilterCount === 0}>
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium">ตัวกรอง {activeFilterCount > 0 ? `· ใช้อยู่ ${activeFilterCount}` : ""}</summary>
        <div className="border-t border-line p-3"><SearchForm params={params} q={q} includePast={includePast} /></div>
      </details>
      <div className="hidden lg:block"><SearchForm params={params} q={q} includePast={includePast} /></div>

      <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.25fr)] xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)]">
        <section className="min-w-0 space-y-2">
          <div className="flex items-center"><p className="text-xs text-muted">พบ {results.length} รายการ</p></div>
          {results.length === 0 && <p className="rounded-2xl border border-dashed border-line bg-paper/50 p-8 text-center text-sm text-muted">ไม่พบประกาศที่ตรงกับตัวกรอง ลองลดเงื่อนไขหรือค้นคำอื่น</p>}
          {results.map((item) => {
            const next = new URLSearchParams(base);
            next.set("selected", item.id);
            const past = item.status === "PAST" || !!(item.expiresAt && item.expiresAt < new Date());
            return (
              <div key={item.id}>
                <Link href={`/items/${item.id}`} className="axis-card-interactive block rounded-2xl border border-line bg-paper p-4 lg:hidden">
                  <div className="flex flex-wrap gap-1 text-[10px] text-muted"><span>{TYPE_LABEL[item.type]}</span><span>·</span><span>{AUDIENCE_LABEL[item.audience]}</span>{past && <><span>·</span><span className="text-amber">สิ้นสุดแล้ว</span></>}</div>
                  <h2 className="mt-1.5 text-sm font-medium">{item.title}</h2>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted">{item.body}</p>
                </Link>
                <Link href={`/search?${next.toString()}`} className={`hidden rounded-2xl bg-paper p-3.5 lg:block ${selected?.id === item.id ? "ring-2 ring-brand" : "ring-1 ring-line/60"}`}>
                  <div className="flex flex-wrap gap-1 text-[10px] text-muted"><span>{TYPE_LABEL[item.type]}</span><span>·</span><span>{AUDIENCE_LABEL[item.audience]}</span>{past && <><span>·</span><span className="text-amber">สิ้นสุดแล้ว</span></>}</div>
                  <h2 className="mt-1 text-sm font-medium">{item.title}</h2>
                </Link>
              </div>
            );
          })}
        </section>

        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          {selected ? (
            <div className="rounded-3xl bg-paper p-5 ring-1 ring-line/60 xl:p-6">
              <div className="flex flex-wrap gap-1.5 text-[10px] text-muted"><span className="rounded bg-brandsoft px-2 py-1 text-branddeep">{TYPE_LABEL[selected.type]}</span><span className="rounded bg-wash px-2 py-1">{AUDIENCE_LABEL[selected.audience]}</span>{selected.targetYear && <span className="rounded bg-wash px-2 py-1">ปี {selected.targetYear}</span>}</div>
              <h2 className="mt-3 text-xl xl:text-2xl">{selected.title}</h2>
              <p className="mt-3 max-h-[45vh] overflow-y-auto whitespace-pre-wrap pr-1 text-sm leading-7 text-muted">{selected.body}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">{selected.location && <span className="rounded-full bg-wash px-3 py-1">📍 {selected.location}</span>}{selected.expiresAt && <span className="rounded-full bg-wash px-3 py-1">หมดเขต {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(selected.expiresAt)}</span>}</div>
              <Link href={`/items/${selected.id}`} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm text-white">เปิดประกาศ →</Link>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">เลือกรายการเพื่อดูตัวอย่าง</div>
          )}
        </aside>
      </div>
    </div>
  );
}

function SearchForm({ params, q, includePast }: { params: SearchParams; q: string; includePast: boolean }) {
  return (
    <form className="grid gap-2 rounded-2xl bg-paper p-3 ring-1 ring-line/60 sm:grid-cols-2 lg:grid-cols-6 lg:p-4">
      <label className="sm:col-span-2 lg:col-span-2"><span className="sr-only">คำค้นหา</span><input name="q" defaultValue={q} placeholder="ค้นหาหัวข้อหรือเนื้อหา" className="min-h-11 w-full rounded-xl border border-line px-3 text-sm" /></label>
      <select name="type" defaultValue={params.type ?? "ALL"} className="min-h-11 rounded-xl border border-line px-3 text-sm"><option value="ALL">ทุกประเภท</option>{Object.entries(TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select name="program" defaultValue={params.program ?? "ALL"} className="min-h-11 rounded-xl border border-line px-3 text-sm"><option value="ALL">ทุกหลักสูตร</option><option value="CPE">CPE</option><option value="SKE">SKE</option></select>
      <select name="year" defaultValue={params.year ?? ""} className="min-h-11 rounded-xl border border-line px-3 text-sm"><option value="">ทุกชั้นปี</option>{[1, 2, 3, 4].map((year) => <option key={year} value={year}>ปี {year}</option>)}</select>
      <button className="min-h-11 rounded-xl bg-brand px-4 text-sm text-white">ค้นหา</button>
      <label className="flex min-h-10 items-center gap-2 text-xs text-muted sm:col-span-2 lg:col-span-6"><input type="checkbox" name="past" value="1" defaultChecked={includePast} className="h-4 w-4 accent-brand" /> รวมประกาศที่ผ่านมาแล้ว</label>
    </form>
  );
}
