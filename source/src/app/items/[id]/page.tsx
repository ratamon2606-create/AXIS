import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  TYPE_LABEL,
  TYPE_FIELDS,
  isPast,
  daysLeft,
  threadChildWhere,
} from "@/lib/items";
import { markPast, extendItem } from "@/app/actions/lifecycle";
import { createFollowUp } from "@/app/actions/content";
import { AttachmentList } from "@/components/AttachmentList";
import { AttachmentUpload } from "@/components/AttachmentUpload";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const signedIn = !!session?.user;
  const canWrite =
    session?.user?.role === "EDITOR" || session?.user?.role === "ADMIN";

  const item = await db.contentItem.findUnique({
    where: { id },
    include: {
      // follow-up เป็น ContentItem จริง จึงต้องกรองสิทธิ์และสถานะเหมือนข้อมูลอื่น
      children: {
        where: threadChildWhere(signedIn),
        orderBy: { createdAt: "asc" },
      },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!item || (item.status !== "PUBLISHED" && item.status !== "PAST")) {
    notFound();
  }

  if (item.visibility === "KU_ONLY" && !signedIn) {
    notFound();
  }

  const details = (item.details ?? {}) as Record<string, string>;
  const rows = (TYPE_FIELDS[item.type] ?? []).filter((f) => details[f.key]);
  const past = isPast(item);
  const remainingDays = daysLeft(item.expiresAt);

  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <Link href="/" className="text-xs text-muted">
        ← กลับไปหน้าประกาศ
      </Link>

      <div className="flex flex-wrap gap-1.5">
        <span className="rounded bg-brandsoft px-2 py-0.5 text-[11px] font-medium text-branddeep">
          {TYPE_LABEL[item.type]}
        </span>
        <span className="rounded bg-wash px-2 py-0.5 text-[11px] text-muted">
          {item.department}
        </span>
        {item.visibility === "KU_ONLY" && (
          <span className="rounded bg-wash px-2 py-0.5 text-[11px] text-muted">
            🔒 เฉพาะ KU
          </span>
        )}
        {past && (
          <span className="rounded bg-wash px-2 py-0.5 text-[11px] font-medium text-muted">
            จบไปแล้ว
          </span>
        )}
        {!past && remainingDays !== null && (
          <span className="rounded bg-brandsoft px-2 py-0.5 text-[11px] font-medium text-branddeep">
            {remainingDays <= 0 ? "หมดเขตวันนี้" : `เหลืออีก ${remainingDays} วัน`}
          </span>
        )}
      </div>

      <h1 className="text-xl leading-snug">{item.title}</h1>

      {rows.length > 0 && (
        <dl className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line/60">
          {rows.map((f) => (
            <div
              key={f.key}
              className="flex gap-3 border-b border-line px-3 py-2.5 last:border-0"
            >
              <dt className="w-24 shrink-0 text-xs text-faint">{f.label}</dt>
              <dd className="text-sm">{details[f.key]}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="whitespace-pre-wrap text-sm leading-7">{item.body}</p>

      <AttachmentList attachments={item.attachments} canEdit={canWrite} />
      {canWrite && <AttachmentUpload itemId={item.id} />}

      {canWrite && (
        <div className="flex flex-wrap gap-2 rounded-2xl bg-paper p-3 ring-1 ring-line/60">
          <Link
            href={`/admin/${item.id}/edit`}
            className="rounded-xl border border-line px-4 py-2 text-sm"
          >
            ✎ แก้ไขประกาศ
          </Link>

          {!past ? (
            <form action={markPast}>
              <input type="hidden" name="id" value={item.id} />
              <button className="rounded-xl border border-line px-4 py-2 text-sm">
                ให้ประกาศนี้จบเลย
              </button>
            </form>
          ) : (
            <form action={extendItem}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="days" value="30" />
              <button className="rounded-xl border border-line px-4 py-2 text-sm">
                ต่ออายุ 30 วัน
              </button>
            </form>
          )}
        </div>
      )}

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
            <div
              key={child.id}
              className="relative rounded-xl bg-paper p-3 ring-1 ring-line/60"
            >
              <span
                className={`absolute -left-[22px] top-4 h-2.5 w-2.5 rounded-full border-2 ${
                  i === item.children.length - 1
                    ? "border-brand bg-brand"
                    : "border-line bg-paper"
                }`}
              />
              <p className="text-[11px] text-faint">
                {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(child.createdAt)} · อัปเดต
              </p>
              <h3 className="mt-1 text-sm font-medium">{child.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-muted">
                {child.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {canWrite && (
        <form action={createFollowUp} className="space-y-3 rounded-2xl bg-paper p-4 ring-1 ring-line/60">
          <input type="hidden" name="parentId" value={item.id} />
          <div>
            <h2 className="text-sm font-medium">เพิ่มโพสต์ต่อในเธรด</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              โพสต์ต่อจะใช้ประเภท ภาควิชา และการมองเห็นเดียวกับประกาศต้นเรื่อง
            </p>
          </div>
          <input
            name="title"
            required
            placeholder="หัวข้ออัปเดต"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
          />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="รายละเอียดอัปเดต"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
          />
          <button className="rounded-xl bg-brand px-4 py-2.5 text-sm text-white">
            เพิ่มอัปเดต
          </button>
        </form>
      )}
    </article>
  );
}
