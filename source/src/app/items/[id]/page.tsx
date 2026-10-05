import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AUDIENCE_LABEL, canEditItem, canReadItem, isPast, TYPE_LABEL } from "@/lib/items";
import { AttachmentList } from "@/components/AttachmentList";
import { AttachmentUpload } from "@/components/AttachmentUpload";
import SaveButton from "@/components/SaveButton";
import { addFollowUp } from "@/app/actions/thread";
import { extendItem, hideItem, markPast, setPinned } from "@/app/actions/lifecycle";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth().catch(() => null);
  const signedIn = !!session?.user;

  const item = await db.contentItem.findUnique({
    where: { id },
    include: {
      author: true,
      attachments: true,
      children: { orderBy: { createdAt: "asc" }, include: { attachments: true } },
      savedBy: session?.user ? { where: { userId: session.user.id } } : false,
    },
  });

  if (!item || (!canReadItem(item, signedIn) && !(session?.user.role === "ADMIN" && item.status === "HIDDEN"))) notFound();

  const children = item.children.filter((child) => canReadItem(child, signedIn));
  const canEdit = !!session?.user && canEditItem(session.user, item);
  const saved = "savedBy" in item && Array.isArray(item.savedBy) && item.savedBy.length > 0;
  const past = isPast(item);

  return (
    <article className="space-y-5">
      <section className="rounded-3xl bg-paper p-5 ring-1 ring-line/60">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5 text-[10px] text-muted">
              <span className="rounded bg-brandsoft px-2 py-1 text-branddeep">{TYPE_LABEL[item.type]}</span>
              <span className="rounded bg-wash px-2 py-1">{AUDIENCE_LABEL[item.audience]}</span>
              {item.targetYear && <span className="rounded bg-wash px-2 py-1">ปี {item.targetYear}</span>}
              {item.visibility === "KU_ONLY" && <span className="rounded bg-wash px-2 py-1">🔒 KU</span>}
              {past && <span className="rounded bg-ambersoft px-2 py-1 text-amber">สิ้นสุดแล้ว</span>}
            </div>
            <h1 className="mt-3 text-2xl">{item.title}</h1>
            <p className="mt-1 text-xs text-muted">โดย {item.author.name ?? item.author.email}</p>
          </div>
          {session?.user && <SaveButton itemId={item.id} initialSaved={saved} />}
        </div>

        <div className="mt-5 grid gap-2 text-xs text-muted sm:grid-cols-2">
          {item.eventStart && <p>🗓 {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(item.eventStart)}</p>}
          {item.location && <p>📍 {item.location}</p>}
          {item.expiresAt && <p>⏳ หมดเขต {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(item.expiresAt)}</p>}
        </div>

        <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-ink">{item.body}</p>
      </section>

      {item.attachments.length > 0 && <section className="space-y-2"><h2 className="text-base">ไฟล์แนบ</h2><AttachmentList attachments={item.attachments} canEdit={canEdit} /></section>}
      {canEdit && <AttachmentUpload itemId={item.id} />}

      {canEdit && (
        <section className="flex flex-wrap gap-2 rounded-2xl bg-paper p-3 ring-1 ring-line/60">
          <Link href={`/admin/${item.id}/edit`} className="rounded-xl border border-line px-3 py-2 text-xs">✎ แก้ไข</Link>
          {!past && <form action={markPast}><input type="hidden" name="id" value={item.id} /><button className="rounded-xl border border-line px-3 py-2 text-xs">ให้จบ</button></form>}
          <form action={setPinned}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="pinned" value={item.pinned ? "0" : "1"} /><button className="rounded-xl border border-line px-3 py-2 text-xs">{item.pinned ? "เอาหมุดออก" : "ปักหมุด"}</button></form>
          {past && <form action={extendItem} className="flex gap-1"><input type="hidden" name="id" value={item.id} /><input type="number" name="days" min="1" max="365" defaultValue="30" className="w-20 rounded-xl border border-line px-2 py-1 text-xs" /><button className="rounded-xl border border-line px-3 py-2 text-xs">ต่ออายุ</button></form>}
          {session?.user.role === "ADMIN" && <form action={hideItem} className="ml-auto"><input type="hidden" name="id" value={item.id} /><button className="rounded-xl bg-danger px-3 py-2 text-xs text-white">ซ่อนถาวร</button></form>}
        </section>
      )}

      <section className="space-y-3">
        <div><h2 className="text-base">Updates</h2><p className="text-xs text-muted">ประกาศหลักสมบูรณ์ได้เอง อัปเดตส่วนนี้เป็นข้อมูลเพิ่มเติม</p></div>
        {children.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">No updates yet.</p> : (
          <div className="space-y-2">
            {children.map((child) => {
              const images = child.attachments.filter((attachment) => attachment.mimeType.startsWith("image/"));
              const files = child.attachments.filter((attachment) => !attachment.mimeType.startsWith("image/"));
              const canEditChild = !!session?.user && canEditItem(session.user, child);

              return (
                <div key={child.id} className="rounded-2xl bg-paper p-4 ring-1 ring-line/60">
                  <p className="text-[11px] text-faint">
                    {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(child.createdAt)} · อัปเดต
                  </p>
                  <h3 className="mt-1 text-sm font-medium">{child.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-muted">{child.body}</p>

                  {images.length > 0 && (
                    <div className={`mt-3 grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                      {images.map((image) => (
                        <a
                          key={image.id}
                          href={`/api/files/${image.id}`}
                          className="block overflow-hidden rounded-2xl bg-wash"
                        >
                          <img
                            src={`/api/files/${image.id}?view=1`}
                            alt={image.fileName}
                            className={`w-full object-cover ${images.length === 1 ? "max-h-[28rem]" : "aspect-square"}`}
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="mt-3">
                      <AttachmentList attachments={files} canEdit={canEditChild} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {canEdit && (
          <form action={addFollowUp.bind(null, item.id)} className="space-y-3 rounded-2xl bg-paper p-4 ring-1 ring-line/60">
            <h3 className="text-sm font-medium">+ Add update</h3>
            <input
              name="title"
              required
              placeholder="หัวข้ออัปเดต"
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
            />
            <textarea
              name="body"
              required
              rows={3}
              placeholder="รายละเอียด"
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
            />
            <div className="rounded-xl border border-dashed border-line p-3">
              <label className="mb-2 block text-xs font-medium text-muted">เพิ่มรูปภาพ (สูงสุด 4 รูป)</label>
              <input
                type="file"
                name="images"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="w-full text-sm"
              />
              <p className="mt-1 text-[11px] text-faint">JPG, PNG หรือ WebP · ไม่เกิน 20 MB ต่อรูป</p>
            </div>
            <button className="rounded-xl bg-brand px-4 py-2 text-sm text-white">เพิ่มอัปเดต</button>
          </form>
        )}
      </section>
    </article>
  );
}
