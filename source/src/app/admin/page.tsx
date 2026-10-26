import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { AUDIENCE_LABEL, TYPE_LABEL } from "@/lib/items";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "ร่าง",
  PUBLISHED: "เผยแพร่",
  PAST: "สิ้นสุดแล้ว",
  HIDDEN: "ซ่อนถาวร",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role === "READER") redirect("/");
  const ownOnly = session.user.role === "ADMIN" ? {} : { authorId: session.user.id };
  const [published, drafts, items] = await Promise.all([
    db.contentItem.count({ where: { ...ownOnly, status: "PUBLISHED", parentId: null } }),
    db.contentItem.count({ where: { ...ownOnly, status: "DRAFT", parentId: null } }),
    db.contentItem.findMany({ where: { ...ownOnly, parentId: null }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">ผู้เขียน</p><h1 className="mt-1 text-2xl sm:text-3xl">แผงผู้เขียน</h1><p className="mt-1 text-sm text-muted"></p></div><Link href="/admin/new" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm text-white sm:ml-auto">+ สร้างประกาศ</Link></div>
      <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-paper p-4 ring-1 ring-line/60"><p className="text-xs text-muted">เผยแพร่</p><p className="mt-1 font-display text-2xl">{published}</p></div><div className="rounded-2xl bg-paper p-4 ring-1 ring-line/60"><p className="text-xs text-muted">ร่าง</p><p className="mt-1 font-display text-2xl">{drafts}</p></div></div>
      {items.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">ยังไม่มีประกาศ</p> : <ul className="axis-auto-grid-wide">{items.map((item) => <li key={item.id} className="flex h-full flex-col rounded-2xl bg-paper p-4 ring-1 ring-line/60"><p className="text-[11px] text-muted">{TYPE_LABEL[item.type]} · {AUDIENCE_LABEL[item.audience]} · {STATUS_LABEL[item.status] ?? item.status}</p><h2 className="mt-1 text-sm font-medium sm:text-base">{item.title}</h2><p className="mt-2 line-clamp-2 flex-1 text-xs leading-5 text-muted">{item.body}</p><div className="mt-4 grid grid-cols-2 gap-2"><Link href={`/items/${item.id}`} className="flex min-h-10 items-center justify-center rounded-lg border border-line px-3 text-xs">ดู</Link><Link href={`/admin/${item.id}/edit`} className="flex min-h-10 items-center justify-center rounded-lg bg-brandsoft px-3 text-xs text-branddeep">แก้ไข</Link></div></li>)}</ul>}
    </div>
  );
}
