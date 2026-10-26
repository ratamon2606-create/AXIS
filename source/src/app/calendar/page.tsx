import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TYPE_LABEL, visibleWhere } from "@/lib/items";

export const dynamic = "force-dynamic";

function monthStart(value?: string) {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (match) return new Date(`${match[1]}-${match[2]}-01T00:00:00+07:00`);
  const now = new Date();
  return new Date(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01T00:00:00+07:00`);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const session = await auth().catch(() => null);
  const start = monthStart(month);
  const next = new Date(start); next.setMonth(next.getMonth() + 1);
  const previous = new Date(start); previous.setMonth(previous.getMonth() - 1);

  const events = await db.contentItem.findMany({
    where: { AND: [visibleWhere(!!session?.user, "all"), { eventStart: { gte: start, lt: next } }] },
    orderBy: { eventStart: "asc" },
  });

  const byDay = new Map<number, typeof events>();
  for (const item of events) {
    const day = Number(new Intl.DateTimeFormat("en-CA", { day: "numeric", timeZone: "Asia/Bangkok" }).format(item.eventStart!));
    const list = byDay.get(day) ?? [];
    list.push(item);
    byDay.set(day, list);
  }

  const year = start.getFullYear();
  const monthIndex = start.getMonth();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const leading = new Date(year, monthIndex, 1).getDay();
  const cells = Array.from({ length: leading + days }, (_, index) => (index < leading ? null : index - leading + 1));
  const monthLabel = new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric", timeZone: "Asia/Bangkok" }).format(start);

  return (
    <div className="axis-calendar-page space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">ปฏิทิน</p>
          <h1 className="mt-1 text-2xl sm:text-3xl">ปฏิทินกิจกรรม</h1>
          <p className="mt-1 text-sm text-muted"></p>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Link href={`/calendar?month=${monthKey(previous)}`} className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-line bg-paper" aria-label="เดือนก่อน">←</Link>
          <Link href="/calendar" className="min-h-11 rounded-xl border border-line bg-paper px-3 py-2 text-sm">เดือนนี้</Link>
          <Link href={`/calendar?month=${monthKey(next)}`} className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-line bg-paper" aria-label="เดือนถัดไป">→</Link>
        </div>
      </div>

      <div className="axis-calendar-monthbar flex items-center justify-between rounded-2xl bg-paper px-4 py-2.5 ring-1 ring-line/60">
        <h2 className="text-lg">{monthLabel}</h2><span className="text-xs text-muted">{events.length} กิจกรรม</span>
      </div>

      <section className="space-y-2 lg:hidden" aria-label="รายการกิจกรรมรายวัน">
        {events.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">เดือนนี้ยังไม่มีกิจกรรม</p>
        ) : (
          Array.from(byDay.entries()).map(([day, list]) => (
            <div key={day} className="axis-panel overflow-hidden">
              <div className="flex items-center gap-3 border-b border-line bg-wash/70 px-4 py-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-paper text-sm font-medium ring-1 ring-line">{day}</span>
                <span className="text-sm text-muted">{new Intl.DateTimeFormat("th-TH", { weekday: "long", month: "long", timeZone: "Asia/Bangkok" }).format(list[0].eventStart!)}</span>
              </div>
              <div className="divide-y divide-line">
                {list.map((item) => (
                  <Link key={item.id} href={`/items/${item.id}`} className="flex gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1"><p className="text-[11px] text-branddeep">{TYPE_LABEL[item.type]}</p><h3 className="mt-0.5 text-sm font-medium">{item.title}</h3>{item.location && <p className="mt-1 truncate text-xs text-muted">📍 {item.location}</p>}</div>
                    <span className="self-center text-muted">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="axis-calendar-desktop hidden lg:block" aria-label="ปฏิทินแบบเดือน">
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted">{["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((label) => <div key={label} className="py-2">{label}</div>)}</div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, index) => (
            <div key={index} className={`axis-calendar-cell min-w-0 rounded-lg border p-1.5 ${day ? "border-line bg-paper" : "border-transparent"}`}>
              {day && <>
                <p className="text-sm font-medium text-muted">{day}</p>
                <div className="mt-1 space-y-1">
                  {(byDay.get(day) ?? []).slice(0, 2).map((item) => (
                    <Link key={item.id} href={`/items/${item.id}`} title={item.title} className="block overflow-hidden rounded-md bg-brandsoft px-1.5 py-1 text-[11px] leading-4 text-branddeep">
                      <span className="block truncate font-medium">{item.title}</span><span className="block truncate opacity-70">{TYPE_LABEL[item.type]}</span>
                    </Link>
                  ))}
                  {(byDay.get(day) ?? []).length > 2 && <p className="px-1 text-[9px] text-muted">+{(byDay.get(day) ?? []).length - 2} รายการ</p>}
                </div>
              </>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
