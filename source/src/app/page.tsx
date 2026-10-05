import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { audienceMatches, daysLeft, visibleWhere } from "@/lib/items";
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
    <div className="space-y-6">
      {!signedIn ? (
        <div className="rounded-3xl bg-gradient-to-br from-brand to-branddeep p-5 text-white">
          <p className="font-display text-xl">AXIS · ข่าวสารภาควิชา ที่เดียวจบ</p>
          <p className="mt-2 text-sm opacity-90">ค้นหา กรอง ดูปฏิทิน และกลับมาอ่านประกาศสำคัญได้ง่ายขึ้น</p>
          <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
            <button className="mt-4 rounded-xl bg-paper px-4 py-2 text-sm text-branddeep">เข้าสู่ระบบด้วยบัญชี @ku.th</button>
          </form>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">Dashboard</p>
            <h1 className="mt-1 text-xl">สวัสดี {session.user.name ?? "นิสิต"}</h1>
            <p className="mt-1 text-sm text-muted">สิ่งที่ควรรู้ในช่วงนี้</p>
          </div>
          <Link href="/announcements" className="ml-auto rounded-xl bg-brand px-4 py-2 text-sm text-white">เปิดชั้นหนังสือ →</Link>
        </div>
      )}

      <Section title="ใกล้ถึงกำหนด" subtitle="ภายใน 7 วัน" items={deadlines.slice(0, 4)} />
      <Section title="กิจกรรม 7 วันนี้" subtitle="เรียงตามวันเริ่มกิจกรรม" items={events.slice(0, 4)} />
      <Section title={signedIn ? "ใหม่สำหรับคุณ" : "ประกาศล่าสุด"} subtitle={signedIn ? "อิงจากหลักสูตรและชั้นปี โดยไม่ซ่อนรายการอื่น" : "ประกาศสาธารณะล่าสุด"} items={personal.slice(0, 6)} />

      {signedIn && (
        <section className="space-y-2">
          <div className="flex items-end gap-2"><div><h2 className="text-base">บันทึกไว้</h2><p className="text-xs text-muted">กลับมาอ่านภายหลัง</p></div><Link href="/saved" className="ml-auto text-xs text-branddeep underline">ดูทั้งหมด</Link></div>
          {saved.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">ยังไม่มีรายการที่บันทึกไว้</p> : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{saved.map(({ item }) => <Card key={item.id} item={item} />)}</div>
          )}
        </section>
      )}
    </div>
  );
}

function Section({ title, subtitle, items }: { title: string; subtitle: string; items: Array<any> }) {
  return (
    <section className="space-y-2">
      <div><h2 className="text-base">{title}</h2><p className="text-xs text-muted">{subtitle}</p></div>
      {items.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">ยังไม่มีรายการ</p> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Card key={item.id} item={item} />)}</div>
      )}
    </section>
  );
}
