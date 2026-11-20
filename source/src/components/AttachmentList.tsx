import type { Attachment } from "@prisma/client";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { removeAttachment, setCoverImage } from "@/app/actions/attachments";
import { ImageCarousel } from "@/components/ImageCarousel";

export function AttachmentList({ attachments, canEdit, allowCover = false, selectedCoverId = null }: {
  attachments: Attachment[];
  canEdit: boolean;
  allowCover?: boolean;
  selectedCoverId?: string | null;
}) {
  if (!attachments.length) return null;
  const images = attachments.filter((a) => a.mimeType.startsWith("image/"));
  const documents = attachments.filter((a) => !a.mimeType.startsWith("image/"));
  const cover = images.find((a) => a.id === selectedCoverId)?.id ?? images[0]?.id ?? null;
  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="space-y-3">
          <ImageCarousel images={images.map((a) => ({ id: a.id, fileName: a.fileName }))} initialImageId={cover} />
          {canEdit && (
            <ul className="space-y-2">
              {images.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line/60 bg-paper px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-muted" title={a.fileName}>{a.fileName}</span>
                  {allowCover && (a.id === cover ? (
                    <span className="rounded-lg bg-brandsoft px-2 py-1 text-xs font-medium text-branddeep">รูปหน้าปก</span>
                  ) : (
                    <form action={setCoverImage}>
                      <input type="hidden" name="itemId" value={a.itemId} />
                      <input type="hidden" name="attachmentId" value={a.id} />
                      <button className="rounded-lg border border-brand/40 px-2 py-1 text-xs text-branddeep" type="submit">ตั้งเป็นหน้าปก</button>
                    </form>
                  ))}
                  <form action={removeAttachment}>
                    <input type="hidden" name="attachmentId" value={a.id} />
                    <ConfirmSubmitButton message="ลบไฟล์แนบนี้ถาวร?" className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted">ลบ</ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5 ring-1 ring-line/60">
              <a href={"/api/files/" + a.id} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.fileName}</p>
                <p className="text-xs text-muted">{(a.size / 1024).toFixed(0)} KB · แตะเพื่อดาวน์โหลด</p>
              </a>
              {canEdit && (
                <form action={removeAttachment}>
                  <input type="hidden" name="attachmentId" value={a.id} />
                  <ConfirmSubmitButton message="ลบไฟล์แนบนี้ถาวร?" className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted">ลบ</ConfirmSubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
