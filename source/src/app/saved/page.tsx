import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AUDIENCE_LABEL, canReadItem, TYPE_LABEL } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const rows = await db.savedItem.findMany({
    where: { userId: session.user.id },
    include: { item: true },
    orderBy: { createdAt: "desc" },
  });
  const rowsVisible = rows.filter(({ item }) => canReadItem(item, true));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">ส่วนตัว</p><h1 className="mt-1 text-2xl sm:text-3xl">บันทึกไว้</h1><p className="mt-1 text-sm text-muted">รายการส่วนตัวของคุณ</p></div>
        <span className="sm:ml-auto rounded-full bg-paper px-3 py-1.5 text-xs text-muted ring-1 ring-line/60">{rowsVisible.length} รายการ</span>
      </div>
      {rowsVisible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper/50 p-8 text-center"><p className="text-sm text-muted">ยังไม่มีประกาศที่บันทึกไว้</p><Link href="/announcements" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-brand px-4 text-sm text-white">ไปดูข่าวสาร</Link></div>
      ) : (
        <div className="axis-auto-grid-wide">
          {rowsVisible.map(({ item }) => (
            <Link key={item.id} href={`/items/${item.id}`} className="axis-card-interactive flex h-full flex-col rounded-2xl border border-line bg-paper p-4">
              <div className="flex flex-wrap gap-1 text-[11px] text-muted"><span>{TYPE_LABEL[item.type]}</span><span>·</span><span>{AUDIENCE_LABEL[item.audience]}</span>{item.targetYear && <><span>·</span><span>ปี {item.targetYear}</span></>}</div>
              <h2 className="mt-1.5 text-sm font-medium sm:text-base">{item.title}</h2>
              <p className="mt-2 line-clamp-3 flex-1 text-xs leading-5 text-muted">{item.body}</p>
              <span className="mt-4 text-xs font-medium text-branddeep">เปิดประกาศ →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
