import Link from "next/link";
import { BackToPrevious } from "@/components/BackToPrevious";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AUDIENCE_LABEL, canEditItem, canReadItem, canReadItemWithParent, isPast, TYPE_FIELDS, TYPE_LABEL } from "@/lib/items";
import { AttachmentList } from "@/components/AttachmentList";
import { importantDate } from "@/lib/smart-dates";
import { AttachmentUpload } from "@/components/AttachmentUpload";
import SaveButton from "@/components/SaveButton";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { FollowUpForm } from "@/components/FollowUpForm";
import { EditFollowUpForm } from "@/components/EditFollowUpForm";
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

  const returnTo =
    rawReturnTo && /^\/announcements(?:\/|\?|#|$)/.test(rawReturnTo)
      ? rawReturnTo
      : "/announcements";

  const session = await auth().catch(() => null);
  const signedIn = !!session?.user;

  const item = await db.contentItem.findUnique({
    where: { id },
    include: {
      author: true,
      parent: { select: { status: true, visibility: true } },
      attachments: true,
      children: { orderBy: { createdAt: "asc" }, include: { attachments: true } },
      savedBy: session?.user ? { where: { userId: session.user.id } } : false,
    },
  });

  if (!item) notFound();
  const canEdit = !!session?.user && canEditItem(session.user, item);
  const canPreviewDraft = canEdit && item.status === "DRAFT" && !item.parentId;
  const adminCanInspectHidden = session?.user.role === "ADMIN" && item.status === "HIDDEN" && !item.parentId;
  if (!canReadItemWithParent(item, signedIn) && !canPreviewDraft && !adminCanInspectHidden) notFound();

  const children = item.children.filter((child) => canReadItem(child, signedIn) && (canReadItem(item, signedIn) || adminCanInspectHidden));
  const saved = "savedBy" in item && Array.isArray(item.savedBy) && item.savedBy.length > 0;
  const past = isPast(item);

  return (
    <article className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <BackToPrevious fallbackHref={returnTo} preferFallback={!!rawReturnTo && returnTo !== "/announcements"} />
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
                {canPreviewDraft && <span className="rounded bg-ambersoft px-2 py-1 text-amber">ตัวอย่างร่าง · ยังไม่เผยแพร่</span>}
                {adminCanInspectHidden && <span className="rounded bg-dangersoft px-2 py-1 text-danger">ซ่อนถาวร · เฉพาะผู้ดูแล</span>}
              </div>
              <h1 className="mt-3 break-words text-2xl leading-tight sm:text-3xl">{item.title}</h1>
              <p className="mt-2 text-xs text-muted">โดย {item.author.name ?? item.author.email}</p>
              {children.length > 0 && <a href="#updates" className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-full border border-brand/30 bg-brandsoft px-3 text-xs font-medium text-branddeep">↳ มี {children.length} อัปเดต · ดูประวัติการอัปเดต ↓</a>}
            </div>
            {session?.user && <SaveButton itemId={item.id} initialSaved={saved} />}
          </div>

          <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-7 text-ink sm:text-[15px] sm:leading-8">{item.body}</p>
          {TYPE_FIELDS[item.type]?.some(({ key }) => typeof (item.details as Record<string, unknown> | null)?.[key] === "string" && !!(item.details as Record<string, string>)[key]) && (
            <section className="mt-6 space-y-3" aria-label="รายละเอียดเพิ่มเติม">
              {TYPE_FIELDS[item.type].map(({ key, label }) => {
                const value = (item.details as Record<string, unknown> | null)?.[key];
                return typeof value === "string" && value ? <div key={key}><h2 className="text-sm font-medium">{label}</h2><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-muted">{value}</p></div> : null;
              })}
            </section>
          )}

          {item.attachments.length > 0 && <div className="mt-7 space-y-2"><h2 className="text-base">ไฟล์แนบ</h2><AttachmentList attachments={item.attachments} canEdit={canEdit} /></div>}
          {canEdit && item.status !== "HIDDEN" && <div className="mt-4"><AttachmentUpload itemId={item.id} /></div>}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="axis-panel p-4">
            <h2 className="text-sm font-medium">ข้อมูลสำคัญ</h2>
            <dl className="mt-3 space-y-3 text-xs">
              {importantDate(item) && <div><dt className="text-faint">{importantDate(item)!.label}</dt><dd className="mt-0.5 text-branddeep font-medium">{importantDate(item)!.text}</dd></div>}
              {item.eventStart && <div><dt className="text-faint">เริ่มเหตุการณ์</dt><dd className="mt-0.5 text-muted">🗓 {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(item.eventStart)}</dd></div>}
              {item.eventEnd && <div><dt className="text-faint">สิ้นสุดเหตุการณ์</dt><dd className="mt-0.5 text-muted">{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(item.eventEnd)}</dd></div>}
              {item.location && <div><dt className="text-faint">สถานที่</dt><dd className="mt-0.5 break-words text-muted">📍 {item.location}</dd></div>}
              {item.expiresAt && <div><dt className="text-faint">เก็บเข้าคลังหลังวันที่</dt><dd className="mt-0.5 text-muted">⏳ {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(item.expiresAt)}</dd></div>}
              {!item.deadlineAt && !item.eventStart && !item.location && !item.expiresAt && <p className="text-muted">ประกาศนี้ไม่มีวันที่เฉพาะ</p>}
            </dl>
          </section>

          {canEdit && !item.parentId && item.status !== "HIDDEN" && (
            <section className="axis-panel p-4">
              <h2 className="text-sm font-medium">จัดการประกาศ</h2>
              <div className="mt-3 grid gap-2">
                <Link href={`/admin/${item.id}/edit`} className="flex min-h-10 items-center justify-center rounded-xl border border-line px-3 text-xs">✎ แก้ไข</Link>
                {item.status === "PUBLISHED" && !past && <form action={markPast}><input type="hidden" name="id" value={item.id} /><ConfirmSubmitButton message="ยืนยันการปิดประกาศ? ประกาศจะย้ายไปคลังย้อนหลัง" className="min-h-10 w-full rounded-xl border border-line px-3 text-xs">ให้จบ</ConfirmSubmitButton></form>}
                {item.status === "PUBLISHED" && <form action={setPinned}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="pinned" value={item.pinned ? "0" : "1"} /><button className="min-h-10 w-full rounded-xl border border-line px-3 text-xs">{item.pinned ? "เอาหมุดออก" : "ปักหมุด"}</button></form>}
                {past && <form action={extendItem} className="grid grid-cols-[1fr_auto] gap-2"><input type="hidden" name="id" value={item.id} /><input type="number" name="days" min="1" max="365" defaultValue="30" className="min-w-0 rounded-xl border border-line px-2 text-xs" /><button className="min-h-10 rounded-xl border border-line px-3 text-xs">ต่ออายุ</button></form>}
                {session?.user.role === "ADMIN" && <form action={hideItem}><input type="hidden" name="id" value={item.id} /><ConfirmSubmitButton message="ยืนยันซ่อนประกาศนี้ถาวร? ผู้อ่านจะไม่สามารถเปิดประกาศและอัปเดตได้อีก" className="min-h-10 w-full rounded-xl bg-danger px-3 text-xs text-white">ซ่อนถาวร</ConfirmSubmitButton></form>}
              </div>
            </section>
          )}
        </aside>
      </div>

      <section id="updates" className="scroll-mt-24 space-y-3">
        <div><h2 className="text-lg">ประวัติการอัปเดต {children.length > 0 && <span className="ml-2 rounded-full bg-brandsoft px-2.5 py-1 text-xs text-branddeep">{children.length} รายการ</span>}</h2><p className="text-xs text-muted">ประกาศหลักต้องเข้าใจได้ด้วยตัวเอง ส่วนนี้ใช้สำหรับข้อมูลเพิ่มเติมภายหลัง</p></div>
        {children.length === 0 ? <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">ยังไม่มีอัปเดต</p> : (
          <div className="space-y-3">
            {[...children].reverse().map((child, index) => {
              const imageCount = child.attachments.filter((attachment) => ["image/jpeg", "image/png", "image/webp"].includes(attachment.mimeType)).length;
              const canEditChild = !!session?.user && canEditItem(session.user, child) && item.status !== "HIDDEN";
              return (
                <div key={child.id} className="relative rounded-2xl bg-paper p-4 pl-7 ring-1 ring-line/60 sm:p-5 sm:pl-8">
                  <span aria-hidden="true" className="absolute left-3 top-6 h-2.5 w-2.5 rounded-full bg-brand sm:left-4" />
                  <p className="text-[11px] text-faint">{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(child.createdAt)} · {index === 0 ? "อัปเดตล่าสุด" : "อัปเดต"}{child.updatedAt.getTime() - child.createdAt.getTime() > 5000 ? " · แก้ไขแล้ว" : ""}</p>
                  <h3 className="mt-1 text-sm font-medium sm:text-base">{child.title}</h3>
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-6 text-muted sm:text-sm sm:leading-7">{child.body}</p>
                  {child.attachments.length > 0 && <div className="mt-3"><AttachmentList attachments={child.attachments} canEdit={canEditChild} /></div>}
                  {canEditChild && (
                    <EditFollowUpForm followUpId={child.id} title={child.title} body={child.body} currentImageCount={imageCount} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {canEdit && item.status === "PUBLISHED" && <FollowUpForm parentId={item.id} />}
      </section>
    </article>
  );
}
