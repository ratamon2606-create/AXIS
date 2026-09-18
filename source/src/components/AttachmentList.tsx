import type { Attachment } from "@prisma/client";
import { removeAttachment } from "@/app/actions/attachments";

/**
 * รายการไฟล์แนบ · เจ้าของไฟล์คือ Thanakorn (US-6)
 *
 * ลิงก์ชี้ไปที่ /api/files/[id] ไม่ได้ชี้ไปที่ที่เก็บไฟล์โดยตรง
 * เพราะการตรวจสิทธิ์อยู่ที่เส้นทางนั้น
 */
export function AttachmentList({
  attachments,
  canEdit,
}: {
  attachments: Attachment[];
  canEdit: boolean;
}) {
  if (attachments.length === 0) return null;

  return (
    <ul className="space-y-2">
      {attachments.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5 ring-1 ring-line/60"
        >
          <a href={`/api/files/${a.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{a.fileName}</p>
            <p className="text-xs text-muted">
              {(a.size / 1024).toFixed(0)} KB · แตะเพื่อดาวน์โหลด
            </p>
          </a>

          {canEdit && (
            <form action={removeAttachment}>
              <input type="hidden" name="attachmentId" value={a.id} />
              <button className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted">
                ลบ
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
