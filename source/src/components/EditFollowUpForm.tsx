"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { editFollowUp } from "@/app/actions/thread";
import { uploadDirect } from "@/lib/direct-upload-client";
import { checkFile } from "@/lib/file-validation";

export function EditFollowUpForm({
  followUpId,
  title,
  body,
  currentImageCount,
}: {
  followUpId: string;
  title: string;
  body: string;
  currentImageCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const files = data.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
    if (files.length + currentImageCount > 4) {
      setError(`อัปเดตหนึ่งรายการมีรูปได้สูงสุด 4 รูป (มีอยู่แล้ว ${currentImageCount} รูป) กรุณาลบรูปเก่าก่อนเพิ่มใหม่`);
      return;
    }
    for (const file of files) {
      const problem = checkFile({ size: file.size, type: file.type });
      if (problem || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError(`${file.name}: ${problem || "รองรับเฉพาะ JPG, PNG และ WebP"}`);
        return;
      }
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const uploaded = await uploadDirect(files);
      data.delete("images");
      data.set("directUploads", JSON.stringify(uploaded));
      await editFollowUp(followUpId, data);
      setOpen(false);
      setSuccess("บันทึกการแก้ไขอัปเดตเรียบร้อยแล้ว");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "แก้ไขอัปเดตไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      {!open && (
        <button
          type="button"
          className="min-h-9 rounded-xl border border-brand/40 bg-brandsoft px-3 text-xs font-medium text-branddeep hover:border-brand"
          onClick={() => { setOpen(true); setError(""); setSuccess(""); }}
        >
          ✎ แก้ไขอัปเดต
        </button>
      )}
      {success && <p role="status" className="text-xs text-branddeep">{success}</p>}
      {open && (
        <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-brand/30 bg-brandsoft/30 p-3 sm:p-4">
          <h4 className="text-sm font-medium">แก้ไขอัปเดต</h4>
          <label className="block space-y-1 text-xs font-medium">
            <span>หัวข้ออัปเดต</span>
            <input name="title" required maxLength={300} defaultValue={title} disabled={busy} className="min-h-10 w-full rounded-xl border border-line bg-paper px-3 text-sm" />
          </label>
          <label className="block space-y-1 text-xs font-medium">
            <span>รายละเอียด</span>
            <textarea name="body" required maxLength={20000} rows={5} defaultValue={body} disabled={busy} className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm" />
          </label>
          <label className="block space-y-1 text-xs font-medium">
            <span>เพิ่มรูปภาพ (ไม่บังคับ)</span>
            <input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || currentImageCount >= 4} className="block w-full text-xs" />
          </label>
          <p className="text-xs text-muted">มีรูปอยู่แล้ว {currentImageCount}/4 รูป · ต้องการลบรูปเก่าให้ใช้ปุ่ม “ลบ” ใต้รูปในอัปเดตก่อน (รูปเดิมจะไม่ถูกลบเมื่อบันทึกข้อความ)</p>
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} type="submit" className="min-h-10 rounded-xl bg-brand px-4 text-xs font-medium text-white disabled:opacity-60">{busy ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button>
            <button disabled={busy} type="button" onClick={() => { setOpen(false); setError(""); }} className="min-h-10 rounded-xl border border-line bg-paper px-4 text-xs">ยกเลิก</button>
          </div>
        </form>
      )}
    </div>
  );
}
