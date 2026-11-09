import type { Attachment } from "@prisma/client";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { removeAttachment } from "@/app/actions/attachments";

export function AttachmentList({
  attachments,
  canEdit,
}: {
  attachments: Attachment[];
  canEdit: boolean;
}) {
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.mimeType.startsWith("image/"));
  const documents = attachments.filter((a) => !a.mimeType.startsWith("image/"));

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <ul className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
          {images.map((a) => (
            <li key={a.id} className="min-w-0 overflow-hidden rounded-2xl bg-paper ring-1 ring-line/60">
              <a
                href={`/api/files/${a.id}?view=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden bg-wash focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
                aria-label={`เปิดภาพเต็ม ${a.fileName}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/files/${a.id}?view=1`}
                  alt={a.fileName}
                  loading="lazy"
                  decoding="async"
                  className={`w-full object-contain ${images.length === 1 ? "max-h-[36rem]" : "h-64 sm:h-72"}`}
                />
              </a>
              <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                <p className="min-w-0 flex-1 truncate text-xs text-muted" title={a.fileName}>
                  {a.fileName}
                </p>
                <a
                  href={`/api/files/${a.id}`}
                  className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-branddeep hover:border-brand"
                  aria-label={`ดาวน์โหลด ${a.fileName}`}
                >
                  ดาวน์โหลด
                </a>
                {canEdit && (
                  <form action={removeAttachment}>
                    <input type="hidden" name="attachmentId" value={a.id} />
                    <ConfirmSubmitButton
                      message="ลบไฟล์แนบนี้ถาวร?"
                      className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted"
                    >
                      ลบ
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((a) => (
            <li key={a.id} className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5 ring-1 ring-line/60">
              <a href={`/api/files/${a.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.fileName}</p>
                <p className="text-xs text-muted">
                  {(a.size / 1024).toFixed(0)} KB · แตะเพื่อดาวน์โหลด
                </p>
              </a>
              {canEdit && (
                <form action={removeAttachment}>
                  <input type="hidden" name="attachmentId" value={a.id} />
                  <ConfirmSubmitButton
                    message="ลบไฟล์แนบนี้ถาวร?"
                    className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted"
                  >
                    ลบ
                  </ConfirmSubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
