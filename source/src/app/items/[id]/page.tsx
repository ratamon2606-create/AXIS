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

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const rawReturnTo = Array.isArray(query.returnTo)
    ? query.returnTo[0]
    : query.returnTo;

  // ตรวจสอบ return path ให้ย้อนกลับได้เฉพาะหน้าประกาศภายในระบบเท่านั้น
  const returnTo =
    rawReturnTo?.startsWith("/announcements")
      ? rawReturnTo
      : "/announcements";

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
    <article className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={returnTo}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-paper px-3 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
        >
          <span aria-hidden="true">←</span>
          กลับไปชั้นหนังสือ
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="min-w-0 rounded-3xl bg-paper p-4 ring-1 ring-line/60 sm:p-6 lg:p-7">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5 text-[10px] text-muted">
                <span className="rounded bg-brandsoft px-2 py-1 text-branddeep">{TYPE_LABEL[item.type]}</span>
                <span className="rounded bg-wash px-2 py-1">{AUDIENCE_LABEL[item.audience]}</span>
                {item.targetYear && <span className="rounded bg-wash px-2 py-1">ปี {item.targetYear}</span>}
                {item.visibility === "KU_ONLY" && <span className="rounded bg-wash px-2 py-1">🔒 KU</span>}
                {past && <span className="rounded bg-ambersoft px-2 py-1 text-amber">สิ้นสุดแล้ว</span>}
              </div>
              <h1 className="mt-3 break-words text-2xl leading-tight sm:text-3xl">{item.title}</h1>
              <p className="mt-2 text-xs text-muted">โดย {item.author.name ?? item.author.email}</p>
            </div>
            {session?.user && <SaveButton itemId={item.id} initialSaved={saved} />}
          </div>

          <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-7 text-ink sm:text-[15px] sm:leading-8">{item.body}</p>

          {item.attachments.length > 0 && <div className="mt-7 space-y-2"><h2 className="text-base">ไฟล์แนบ</h2><AttachmentList attachments={item.attachments} canEdit={canEdit} /></div>}
          {canEdit && <div className="mt-4"><AttachmentUpload itemId={item.id} /></div>}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="axis-panel p-4">
            <h2 className="text-sm font-medium">ข้อมูลสำคัญ</h2>
            <dl className="mt-3 space-y-3 text-xs">
              {item.eventStart && <div><dt className="text-faint">เริ่มกิจกรรม</dt><dd className="mt-0.5 text-muted">🗓 {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(item.eventStart)}</dd></div>}
              {item.eventEnd && <div><dt className="text-faint">จบกิจกรรม</dt><dd className="mt-0.5 text-muted">{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(item.eventEnd)}</dd></div>}
              {item.location && <div><dt className="text-faint">สถานที่</dt><dd className="mt-0.5 break-words text-muted">📍 {item.location}</dd></div>}
              {item.expiresAt && <div><dt className="text-faint">หมดเขต</dt><dd className="mt-0.5 text-muted">⏳ {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(item.expiresAt)}</dd></div>}
              {!item.eventStart && !item.location && !item.expiresAt && <p className="text-muted">ประกาศนี้ไม่มีวันกิจกรรมหรือวันหมดเขต</p>}
            </dl>
          </section>

          {canEdit && (
            <section className="axis-panel p-4">
              <h2 className="text-sm font-medium">จัดการประกาศ</h2>
              <div className="mt-3 grid gap-2">
                <Link href={`/admin/${item.id}/edit`} className="flex min-h-10 items-center justify-center rounded-xl border border-line px-3 text-xs">✎ แก้ไข</Link>
                {!past && <form action={markPast}><input type="hidden" name="id" value={item.id} /><button className="min-h-10 w-full rounded-xl border border-line px-3 text-xs">ให้จบ</button></form>}
                <form action={setPinned}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="pinned" value={item.pinned ? "0" : "1"} /><button className="min-h-10 w-full rounded-xl border border-line px-3 text-xs">{item.pinned ? "เอาหมุดออก" : "ปักหมุด"}</button></form>
                {past && <form action={extendItem} className="grid grid-cols-[1fr_auto] gap-2"><input type="hidden" name="id" value={item.id} /><input type="number" name="days" min="1" max="365" defaultValue="30" className="min-w-0 rounded-xl border border-line px-2 text-xs" /><button className="min-h-10 rounded-xl border border-line px-3 text-xs">ต่ออายุ</button></form>}
                {session?.user.role === "ADMIN" && <form action={hideItem}><input type="hidden" name="id" value={item.id} /><button className="min-h-10 w-full rounded-xl bg-danger px-3 text-xs text-white">ซ่อนถาวร</button></form>}
              </div>
            </section>
          )}
        </aside>
      </div>

      <section className="space-y-3">
        <div><h2 className="text-lg">อัปเดต</h2><p className="text-xs text-muted">ประกาศหลักต้องเข้าใจได้ด้วยตัวเอง ส่วนนี้ใช้สำหรับข้อมูลเพิ่มเติมภายหลัง</p></div>
        {children.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">ยังไม่มีอัปเดต</p> : (
          <div className="space-y-3">
            {children.map((child) => {
              const images = child.attachments.filter((attachment) => attachment.mimeType.startsWith("image/"));
              const files = child.attachments.filter((attachment) => !attachment.mimeType.startsWith("image/"));
              const canEditChild = !!session?.user && canEditItem(session.user, child);
              return (
                <div key={child.id} className="rounded-2xl bg-paper p-4 ring-1 ring-line/60 sm:p-5">
                  <p className="text-[11px] text-faint">{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(child.createdAt)} · อัปเดต</p>
                  <h3 className="mt-1 text-sm font-medium sm:text-base">{child.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-6 text-muted sm:text-sm sm:leading-7">{child.body}</p>
                  {images.length > 0 && <div className={`mt-3 grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"}`}>{images.map((image) => <a key={image.id} href={`/api/files/${image.id}`} className="block overflow-hidden rounded-2xl bg-wash"><img src={`/api/files/${image.id}?view=1`} alt={image.fileName} className={`w-full object-cover ${images.length === 1 ? "max-h-[34rem]" : "aspect-square"}`} /></a>)}</div>}
                  {files.length > 0 && <div className="mt-3"><AttachmentList attachments={files} canEdit={canEditChild} /></div>}
                </div>
              );
            })}
          </div>
        )}

        {canEdit && (
          <form action={addFollowUp.bind(null, item.id)} className="axis-panel space-y-3 p-4 sm:p-5">
            <div><h3 className="text-sm font-medium">+ เพิ่มอัปเดต</h3><p className="mt-1 text-xs text-muted">เพิ่มข้อความและรูปได้สูงสุด 4 รูป โดยยังใช้ระบบไฟล์แนบที่ตรวจสิทธิ์แบบเดิม</p></div>
            <div className="grid gap-3 lg:grid-cols-2"><input name="title" required placeholder="หัวข้ออัปเดต" className="min-h-11 w-full rounded-xl border border-line px-3 text-sm lg:col-span-2" /><textarea name="body" required rows={4} placeholder="รายละเอียด" className="w-full rounded-xl border border-line px-3 py-2.5 text-sm lg:col-span-2" /><div className="rounded-xl border border-dashed border-line p-3 lg:col-span-2"><label className="mb-2 block text-xs font-medium text-muted">เพิ่มรูปภาพ</label><input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple className="w-full text-sm" /><p className="mt-1 text-[11px] text-faint">JPG, PNG หรือ WebP · สูงสุด 4 รูป · ไม่เกิน 20 MB ต่อรูป</p></div></div>
            <button className="min-h-11 w-full rounded-xl bg-brand px-4 text-sm text-white sm:w-auto">เพิ่มอัปเดต</button>
          </form>
        )}
      </section>
    </article>
  );
}