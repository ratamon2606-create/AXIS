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
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">Personal</p>
        <h1 className="mt-1 text-xl">บันทึกไว้</h1>
      </div>
      {rowsVisible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">ยังไม่มีประกาศที่บันทึกไว้</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rowsVisible.map(({ item }) => (
            <Link key={item.id} href={`/items/${item.id}`} className="rounded-2xl bg-paper p-4 ring-1 ring-line/60">
              <span className="text-[11px] text-muted">{TYPE_LABEL[item.type]} · {AUDIENCE_LABEL[item.audience]}</span>
              <h2 className="mt-1 text-sm font-medium">{item.title}</h2>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{item.body}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
