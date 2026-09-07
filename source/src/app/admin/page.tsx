import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TYPE_LABEL } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role === "READER") redirect("/");

  const [published, drafts, items] = await Promise.all([
    db.contentItem.count({ where: { status: "PUBLISHED", parentId: null } }),
    db.contentItem.count({ where: { status: "DRAFT" } }),
    db.contentItem.findMany({
      where: { parentId: null },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg">แผงผู้ดูแล</h1>
        <Link
          href="/admin/new"
          className="ml-auto rounded-xl bg-brand px-4 py-2 text-sm text-white"
        >
          + สร้างประกาศ
        </Link>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 rounded-2xl bg-paper p-3 ring-1 ring-line/60">
          <p className="text-xs text-muted">เผยแพร่</p>
          <p className="font-display text-xl">{published}</p>
        </div>
        <div className="flex-1 rounded-2xl bg-paper p-3 ring-1 ring-line/60">
          <p className="text-xs text-muted">ร่าง</p>
          <p className="font-display text-xl">{drafts}</p>
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl bg-paper p-3 ring-1 ring-line/60">
            <p className="text-[11px] text-muted">
              {TYPE_LABEL[item.type]} · {item.department} ·{" "}
              {item.status === "PUBLISHED" ? "เผยแพร่แล้ว" : "ร่าง"}
            </p>
            <h2 className="mt-1 text-sm font-medium">{item.title}</h2>
            <div className="mt-2 flex gap-2">
              <Link
                href={`/items/${item.id}`}
                className="rounded-lg border border-line px-3 py-1.5 text-xs"
              >
                ดู
              </Link>
              <Link
                href={`/admin/${item.id}/edit`}
                className="rounded-lg border border-line px-3 py-1.5 text-xs"
              >
                แก้ไข
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
