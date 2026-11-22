"use client";
import { useState } from "react";
import { removeAttachment } from "@/app/actions/attachments";

export type ExistingAttachment = {
  id: string;
  fileName: string;
  size: number;
};

/** Attachment management and upload-picker UI, isolated from the core editor. */
export function ItemAttachmentsFields({
  attachments = [], setErrors,
}: {
  attachments?: ExistingAttachment[];
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const values = { attachments };
  return (
    <>
    <fieldset className="axis-panel axis-form-section" aria-labelledby="axis-form-section-files">
      <div id="axis-form-section-files" className="axis-form-section-title">
        <span className="axis-form-section-number">
          3.
        </span>

        <span>
          รายละเอียดและไฟล์
        </span>
      </div>

      <div className="rounded-xl bg-brandsoft px-3 py-2.5 text-xs leading-6 text-branddeep">
        ช่องเสริมจะเปลี่ยนตามประเภทประกาศ ·{" "}
        {TYPE_LABEL[type]}
      </div>

      {(TYPE_FIELDS[type] ?? []).length >
        0 && (<div className="mt-4 grid gap-4 md:grid-cols-2">
          {(TYPE_FIELDS[type] ?? []).map((f) => (<label key={f.key} className="block">
            <span className="mb-1.5 block text-sm font-medium">
              {f.label}
            </span>

            <input name={`d_${f.key}`} defaultValue={values
              .details?.[f.key] ??
              ""} className={`${field} ${ok}`} />
          </label>))}
        </div>)}
      <label className="mt-4 block rounded-xl border border-dashed border-line p-4">
        <span className="mb-1.5 block text-sm font-medium">
          ไฟล์แนบ / รูปภาพ
        </span>

        <input type="file" name="attachments" multiple className="w-full text-sm" />

        <span className="mt-1 block text-xs text-muted">
          เพิ่มไฟล์ได้ก่อนเผยแพร่
          · สูงสุด 20 MB
          ต่อไฟล์
        </span>

        <span className="mt-1 block text-xs font-medium text-branddeep">
          รูปภาพแรกที่แนบจะใช้เป็นโปสเตอร์ของประกาศและเป็นปกบนชั้นหนังสืออัตโนมัติ
          โดยไม่นับไฟล์ PDF
          และเอกสารสำนักงาน
        </span>
      </label>
      {values.attachments &&
        values
          .attachments
          .length >
        0 && (<div className="mt-4 space-y-2">
          <p className="text-sm font-medium">
            ไฟล์ปัจจุบัน
          </p>

          {values.attachments.filter(file => !removedAttachmentIds.includes(file.id)).map((file) => (<div key={file.id} className="flex items-center gap-3 rounded-xl bg-wash px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm">
              {file.fileName}
            </span>

            <button type="button" onClick={async () => {
              if (!window.confirm("ลบไฟล์แนบนี้ทันที? ข้อมูลอื่นที่ยังไม่ได้บันทึกจะไม่ถูกบันทึก"))
                return;
              const data = new FormData();
              data.set("attachmentId", file.id);
              try {
                await removeAttachment(data);
                setRemovedAttachmentIds(ids => [...ids, file.id]);
              }
              catch (err) {
                setErrors({ server: err instanceof Error ? err.message : "ลบไฟล์ไม่สำเร็จ" });
              }
            }} className="min-h-9 rounded-lg px-2 text-xs text-danger">
              ลบ
            </button>
          </div>))}
        </div>)}
    </fieldset>
    </>
  );
}
