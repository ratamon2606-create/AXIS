import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TYPE_LABEL, TYPE_FIELDS } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const signedIn = !!session?.user;
  const canWrite = session?.user?.role === "EDITOR" || session?.user?.role === "ADMIN";

  const item = await db.contentItem.findUnique({
    where: { id },
    include: { children: { orderBy: { createdAt: "asc" } } },
  });

  if (!item || item.status !== "PUBLISHED") notFound();
  // SRS-8 เปิดที่อยู่ตรงโดยไม่มี session ต้องไม่เห็นรายการที่จำกัดไว้
  if (item.visibility === "KU_ONLY" && !signedIn) notFound();

  const details = (item.details ?? {}) as Record<string, string>;
  const rows = (TYPE_FIELDS[item.type] ?? []).filter((f) => details[f.key]);

  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <Link href="/" className="text-xs text-muted">
        ← กลับไปหน้าประกาศ
      </Link>

      <div className="flex flex-wrap gap-1.5">
        <span className="rounded bg-brandsoft px-2 py-0.5 text-[11px] font-medium text-branddeep">
          {TYPE_LABEL[item.type]}
        </span>
        <span className="rounded bg-wash px-2 py-0.5 text-[11px] text-muted">{item.department}</span>
        {item.visibility === "KU_ONLY" && (
          <span className="rounded bg-wash px-2 py-0.5 text-[11px] text-muted">🔒 เฉพาะ KU</span>
        )}
      </div>

      <h1 className="text-xl leading-snug">{item.title}</h1>

      {rows.length > 0 && (
        <dl className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line/60">
          {rows.map((f) => (
            <div key={f.key} className="flex gap-3 border-b border-line px-3 py-2.5 last:border-0">
              <dt className="w-24 shrink-0 text-xs text-faint">{f.label}</dt>
              <dd className="text-sm">{details[f.key]}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="whitespace-pre-wrap text-sm leading-7">{item.body}</p>

      <section className="space-y-2">
        <h2 className="text-xs font-medium text-muted">
          ความคืบหน้า · {item.children.length} รายการ
        </h2>
        <div className="ml-1.5 space-y-3 border-l-2 border-line pl-4">
          <div className="relative rounded-xl bg-paper p-3 ring-1 ring-line/60">
            <span className="absolute -left-[22px] top-4 h-2.5 w-2.5 rounded-full border-2 border-line bg-paper" />
            <p className="text-[11px] text-faint">
              {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(item.createdAt)} · ประกาศ
            </p>
            <h3 className="mt-1 text-sm font-medium">{item.title}</h3>
          </div>

          {item.children.map((child, i) => (
            <div key={child.id} className="relative rounded-xl bg-paper p-3 ring-1 ring-line/60">
              <span
                className={`absolute -left-[22px] top-4 h-2.5 w-2.5 rounded-full border-2 ${
                  i === item.children.length - 1
                    ? "border-brand bg-brand"
                    : "border-line bg-paper"
                }`}
              />
              <p className="text-[11px] text-faint">
                {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(child.createdAt)} ·
                อัปเดต
              </p>
              <h3 className="mt-1 text-sm font-medium">{child.title}</h3>
              <p className="mt-1 text-xs leading-6 text-muted">{child.body}</p>
            </div>
          ))}
        </div>
      </section>

      {canWrite && (
        <Link
          href={`/admin/${item.id}/edit`}
          className="inline-block rounded-xl border border-line px-4 py-2 text-sm"
        >
          ✎ แก้ไขประกาศนี้
        </Link>
      )}
    </article>
  );
}
