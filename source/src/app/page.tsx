import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { audienceMatches, visibleWhere } from "@/lib/items";
import { Card } from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth().catch(() => null);
  const signedIn = !!session?.user;
  if (session?.user && !session.user.program) redirect("/onboarding");

  const items = await db.contentItem.findMany({
    where: visibleWhere(signedIn),
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 80,
  });

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 86_400_000);
  const deadlines = items
    .filter((item) => item.expiresAt && item.expiresAt >= now && item.expiresAt <= sevenDays)
    .sort((a, b) => a.expiresAt!.getTime() - b.expiresAt!.getTime());
  const events = items
    .filter((item) => item.eventStart && item.eventStart >= now && item.eventStart <= sevenDays)
    .sort((a, b) => a.eventStart!.getTime() - b.eventStart!.getTime());

  const personal = session?.user
    ? [...items].sort((a, b) => {
        const score = (item: typeof a) =>
          (item.pinned ? 10 : 0) +
          (audienceMatches(item.audience, session.user.program) ? 4 : 0) +
          (!item.targetYear || item.targetYear === session.user.year ? 2 : 0);
        return score(b) - score(a) || b.createdAt.getTime() - a.createdAt.getTime();
      })
    : items;

  const saved = session?.user
    ? await db.savedItem.findMany({
        where: { userId: session.user.id },
        include: { item: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      })
    : [];

  return (
    <div className="space-y-7 xl:space-y-8">
      {!signedIn ? (
        <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-brand to-branddeep p-5 text-white sm:p-7 lg:p-9">
          <div className="grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">Department Information and Communication Hub</p>
              <h1 className="mt-2 text-2xl leading-tight sm:text-3xl lg:text-4xl">ข่าวสารภาควิชา ที่เดียวจบ</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">ค้นหา กรอง ดูกิจกรรม และกลับมาอ่านประกาศสำคัญได้ง่ายขึ้น โดยยังใช้กฎการมองเห็นและความปลอดภัยชุดเดียวกันทุกหน้า</p>
            </div>
            <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
              <button className="min-h-11 w-full rounded-xl bg-paper px-5 py-2.5 text-sm font-medium text-branddeep lg:w-auto">เข้าสู่ระบบด้วยบัญชี @ku.th</button>
            </form>
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">หน้าแรก</p>
            <h1 className="mt-1 text-2xl sm:text-3xl">สวัสดี {session.user.name ?? "นิสิต"}</h1>
            <p className="mt-1 text-sm text-muted">สิ่งที่ควรรู้ในช่วงนี้</p>
          </div>
          <Link href="/announcements" className="sm:ml-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm text-white">ดูข่าวสารทั้งหมด →</Link>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <CompactSection title="ใกล้ถึงกำหนด" subtitle="ภายใน 7 วัน" items={deadlines.slice(0, 5)} mode="deadline" />
        <CompactSection title="กิจกรรม 7 วันนี้" subtitle="เรียงตามวันเริ่มกิจกรรม" items={events.slice(0, 5)} mode="event" />
      </div>

      <Section
        title={signedIn ? "ใหม่สำหรับคุณ" : "ประกาศล่าสุด"}
        subtitle={signedIn ? "เรียงตามความเกี่ยวข้อง โดยประกาศที่อ่านได้ยังอยู่ครบ" : "ประกาศสาธารณะล่าสุด"}
        items={personal.slice(0, 6)}
      />

      {signedIn && (
        <section className="space-y-3">
          <div className="flex items-end gap-2">
            <div><h2 className="text-lg">บันทึกไว้</h2><p className="text-xs text-muted">กลับมาอ่านภายหลังโดยไม่เปลี่ยนประกาศต้นฉบับ</p></div>
            <Link href="/saved" className="ml-auto text-xs font-medium text-branddeep underline underline-offset-4">ดูทั้งหมด</Link>
          </div>
          {saved.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-paper/50 p-6 text-center text-sm text-muted">
              ยังไม่มีรายการที่บันทึกไว้ · <Link href="/announcements" className="text-branddeep underline">ไปดูข่าวสาร</Link>
            </div>
          ) : (
            <div className="axis-auto-grid">{saved.map(({ item }) => <Card key={item.id} item={item} />)}</div>
          )}
        </section>
      )}
    </div>
  );
}

function Section({ title, subtitle, items }: { title: string; subtitle: string; items: Array<any> }) {
  return (
    <section className="space-y-3">
      <div><h2 className="text-lg">{title}</h2><p className="text-xs text-muted">{subtitle}</p></div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-paper/50 p-6 text-center text-sm text-muted">ยังไม่มีรายการ</p>
      ) : (
        <div className="axis-auto-grid">{items.map((item) => <Card key={item.id} item={item} />)}</div>
      )}
    </section>
  );
}

function CompactSection({ title, subtitle, items, mode }: { title: string; subtitle: string; items: Array<any>; mode: "deadline" | "event" }) {
  return (
    <section className="axis-panel p-4 sm:p-5">
      <div className="mb-3"><h2 className="text-lg">{title}</h2><p className="text-xs text-muted">{subtitle}</p></div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">ยังไม่มีรายการ</p>
      ) : (
        <div className="divide-y divide-line">
          {items.map((item) => {
            const date = mode === "deadline" ? item.expiresAt : item.eventStart;
            return (
              <Link key={item.id} href={`/items/${item.id}`} className="flex min-w-0 items-center gap-3 py-3 first:pt-1 last:pb-1">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brandsoft text-center text-branddeep">
                  <span className="text-[10px] leading-tight">{date ? new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", timeZone: "Asia/Bangkok" }).format(date) : "-"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">{mode === "deadline" ? "กำหนดส่ง/หมดเขต" : item.location ?? "กิจกรรม"}</p>
                </div>
                <span className="text-muted">→</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
