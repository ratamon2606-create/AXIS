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
  const next = new Date(start);
  next.setMonth(next.getMonth() + 1);
  const previous = new Date(start);
  previous.setMonth(previous.getMonth() - 1);

  const events = await db.contentItem.findMany({
    where: {
      AND: [
        visibleWhere(!!session?.user, "all"),
        { eventStart: { gte: start, lt: next } },
      ],
    },
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

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">Calendar</p>
          <h1 className="mt-1 text-xl">ปฏิทินกิจกรรม</h1>
          <p className="mt-1 text-sm text-muted">ใช้ eventStart จากประกาศเดิม ไม่สร้างข้อมูลซ้ำ</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/calendar?month=${monthKey(previous)}`} className="rounded-xl border border-line bg-paper px-3 py-2 text-sm">←</Link>
          <Link href={`/calendar?month=${monthKey(next)}`} className="rounded-xl border border-line bg-paper px-3 py-2 text-sm">→</Link>
        </div>
      </div>

      <h2 className="text-center text-lg">{new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric", timeZone: "Asia/Bangkok" }).format(start)}</h2>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((label) => <div key={label} className="py-2">{label}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => (
          <div key={index} className={`min-h-28 rounded-xl border p-2 ${day ? "border-line bg-paper" : "border-transparent"}`}>
            {day && <>
              <p className="text-xs text-muted">{day}</p>
              <div className="mt-1 space-y-1">
                {(byDay.get(day) ?? []).slice(0, 3).map((item) => (
                  <Link key={item.id} href={`/items/${item.id}`} className="block rounded-lg bg-brandsoft px-1.5 py-1 text-[10px] leading-4 text-branddeep">
                    {TYPE_LABEL[item.type]} · {item.title}
                  </Link>
                ))}
                {(byDay.get(day) ?? []).length > 3 && <p className="text-[9px] text-muted">+{(byDay.get(day) ?? []).length - 3} more</p>}
              </div>
            </>}
          </div>
        ))}
      </div>
    </div>
  );
}
