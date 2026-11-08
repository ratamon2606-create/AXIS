"use client";

import { useState } from "react";
import { addFollowUp } from "@/app/actions/thread";
import { uploadDirect } from "@/lib/direct-upload-client";
import { checkFile } from "@/lib/file-validation";

export function FollowUpForm({ parentId }: { parentId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const files = fd.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
    if (files.length > 4) { setError("แนบรูปได้สูงสุด 4 รูป"); return; }
    for (const file of files) {
      const problem = checkFile({ size: file.size, type: file.type });
      if (problem || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError(`${file.name}: ${problem || "รองรับเฉพาะ JPG, PNG และ WebP"}`); return;
      }
    }
    setBusy(true); setError(""); setSuccess("");
    try {
      const uploaded = await uploadDirect(files);
      fd.delete("images");
      fd.set("directUploads", JSON.stringify(uploaded));
      await addFollowUp(parentId, fd);
      form.reset();
      setSuccess("เพิ่มอัปเดตเรียบร้อยแล้ว");
    } catch (err) { setError(err instanceof Error ? err.message : "เพิ่มอัปเดตไม่สำเร็จ"); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="axis-panel space-y-3 p-4 sm:p-5">
      <div><h3 className="text-sm font-medium">+ เพิ่มอัปเดต</h3><p className="mt-1 text-xs text-muted">เพิ่มข้อความและรูปได้สูงสุด 4 รูป โดยใช้ Direct Upload</p></div>
      <div className="grid gap-3 lg:grid-cols-2">
        <input name="title" required maxLength={300} placeholder="หัวข้ออัปเดต" className="min-h-11 w-full rounded-xl border border-line px-3 text-sm lg:col-span-2" />
        <textarea name="body" required maxLength={20000} rows={4} placeholder="รายละเอียด" className="w-full rounded-xl border border-line px-3 py-2.5 text-sm lg:col-span-2" />
        <div className="rounded-xl border border-dashed border-line p-3 lg:col-span-2"><label htmlFor="update-images" className="mb-2 block text-xs font-medium text-muted">เพิ่มรูปภาพ</label><input id="update-images" type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple className="w-full text-sm" /><p className="mt-1 text-[11px] text-faint">JPG, PNG หรือ WebP · สูงสุด 4 รูป · ไม่เกิน 20 MB ต่อรูป</p></div>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {success && <p role="status" className="text-sm text-branddeep">{success}</p>}
      <button disabled={busy} className="min-h-11 w-full rounded-xl bg-brand px-4 text-sm text-white disabled:opacity-60 sm:w-auto">{busy ? "กำลังอัปโหลดและเพิ่มอัปเดต..." : "เพิ่มอัปเดต"}</button>
    </form>
  );
}
