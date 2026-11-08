"use client";

import { useState } from "react";
import { uploadAttachment } from "@/app/actions/attachments";
import { uploadDirect } from "@/lib/direct-upload-client";
import { checkFile, MAX_FILE_BYTES } from "@/lib/file-validation";

export function AttachmentUpload({ itemId }: { itemId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");
    if (!(file instanceof File)) { setError("ยังไม่ได้เลือกไฟล์"); return; }
    const problem = checkFile({ size: file.size, type: file.type });
    if (problem) { setError(problem); return; }
    setBusy(true); setError(""); setSuccess("");
    try {
      const uploaded = await uploadDirect([file]);
      fd.delete("file"); fd.set("directUploads", JSON.stringify(uploaded));
      await uploadAttachment(fd);
      form.reset(); setSuccess("เพิ่มไฟล์แนบเรียบร้อยแล้ว");
    } catch (err) { setError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="rounded-xl bg-paper p-3 ring-1 ring-line/60">
      <input type="hidden" name="itemId" value={itemId} />
      <p className="mb-2 text-sm font-medium">เพิ่มไฟล์แนบ</p>
      <input type="file" name="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx,.pptx" className="w-full text-sm" />
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      {success && <p role="status" className="mt-2 text-sm text-branddeep">{success}</p>}
      <div className="mt-2 flex items-center gap-3">
        <button disabled={busy} className="rounded-xl bg-brand px-4 py-2 text-sm text-white disabled:opacity-60">{busy ? "กำลังอัปโหลด..." : "อัปโหลด"}</button>
        <span className="text-xs text-muted">ไม่เกิน {MAX_FILE_BYTES / 1024 / 1024} MB · PDF รูปภาพ และเอกสารสำนักงาน</span>
      </div>
    </form>
  );
}
