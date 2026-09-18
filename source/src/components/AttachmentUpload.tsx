import { uploadAttachment } from "@/app/actions/attachments";
import { MAX_FILE_BYTES } from "@/lib/s3";

/**
 * ช่องอัปโหลดไฟล์แนบ · เจ้าของไฟล์คือ Thanakorn (US-6)
 *
 * แนบหลังจากสร้างประกาศแล้ว ไม่ได้แนบพร้อมตอนสร้าง
 * เพราะไฟล์ต้องรู้ว่าจะผูกกับประกาศไหน และประกาศต้องมี id ก่อน
 */
export function AttachmentUpload({ itemId }: { itemId: string }) {
  return (
    <form action={uploadAttachment} className="rounded-xl bg-paper p-3 ring-1 ring-line/60">
      <input type="hidden" name="itemId" value={itemId} />
      <p className="mb-2 text-sm font-medium">เพิ่มไฟล์แนบ</p>
      <input
        type="file"
        name="file"
        required
        accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.pptx"
        className="w-full text-sm"
      />
      <div className="mt-2 flex items-center gap-3">
        <button className="rounded-xl bg-brand px-4 py-2 text-sm text-white">อัปโหลด</button>
        <span className="text-xs text-muted">
          ไม่เกิน {MAX_FILE_BYTES / 1024 / 1024} MB · PDF รูปภาพ และเอกสาร Office
        </span>
      </div>
    </form>
  );
}
