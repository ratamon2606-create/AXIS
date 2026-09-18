import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TYPE_LABEL, visibleWhere, isPast } from "@/lib/items";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "ร่าง",
  PUBLISHED: "เผยแพร่แล้ว",
  PAST: "จบแล้ว",
  HIDDEN: "ซ่อนถาวร",
};

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-wash text-muted",
  PUBLISHED: "bg-brandsoft text-branddeep",
  PAST: "bg-wash text-muted",
  HIDDEN: "bg-dangersoft text-danger",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role === "READER") redirect("/");

  const [published, drafts, past, hidden, items] = await Promise.all([
    db.contentItem.count({ where: visibleWhere(true, "current") }),
    db.contentItem.count({ where: { status: "DRAFT", parentId: null } }),
    db.contentItem.count({ where: visibleWhere(true, "past") }),
    db.contentItem.count({ where: { status: "HIDDEN", parentId: null } }),
    db.contentItem.findMany({
      where: { parentId: null },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const counters = [
    ["เผยแพร่", published],
    ["ร่าง", drafts],
    ["จบแล้ว", past],
    ["ซ่อนถาวร", hidden],
  ] as const;

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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counters.map(([label, count]) => (
          <div key={label} className="rounded-2xl bg-paper p-3 ring-1 ring-line/60">
            <p className="text-xs text-muted">{label}</p>
            <p className="font-display text-xl">{count}</p>
          </div>
        ))}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const displayStatus = isPast(item) ? "PAST" : item.status;
          return (
          <li key={item.id} className="rounded-2xl bg-paper p-3 ring-1 ring-line/60">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
              <span>{TYPE_LABEL[item.type]} · {item.department}</span>
              <span className={`rounded px-1.5 py-0.5 ${STATUS_TONE[displayStatus] ?? "bg-wash"}`}>
                {STATUS_LABEL[displayStatus] ?? displayStatus}
              </span>
            </div>
            <h2 className="mt-1.5 text-sm font-medium">{item.title}</h2>
            <div className="mt-2 flex gap-2">
              {(displayStatus === "PUBLISHED" || displayStatus === "PAST") && (
                <Link
                  href={`/items/${item.id}`}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs"
                >
                  ดู
                </Link>
              )}
              <Link
                href={`/admin/${item.id}/edit`}
                className="rounded-lg border border-line px-3 py-1.5 text-xs"
              >
                แก้ไข
              </Link>
            </div>
          </li>
          );
        })}
      </ul>
    </div>
  );
}
