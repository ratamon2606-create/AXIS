"use client";
import { useState } from "react";
import { uploadDirect } from "@/lib/direct-upload-client";
import { importantDate } from "@/lib/smart-dates";
import { validateItemForm } from "@/lib/item-form-validation";
import { AUDIENCES, ITEM_TYPES } from "@/lib/content-validation";
import { AUDIENCE_LABEL, TYPE_FIELDS, TYPE_LABEL, } from "@/lib/items";
import { removeAttachment } from "@/app/actions/attachments";
type ExistingAttachment = {
  id: string;
  fileName: string;
  size: number;
};
type Values = {
  id?: string;
  title?: string;
  body?: string;
  type?: string;
  audience?: string;
  targetYear?: number | null;
  visibility?: string;
  status?: string;
  eventStart?: string;
  eventEnd?: string;
  eventLabel?: string;
  deadlineAt?: string;
  deadlineLabel?: string;
  archivePolicy?: "AUTO" | "CUSTOM" | "NEVER";
  expiresAt?: string;
  location?: string;
  details?: Record<string, string>;
  attachments?: ExistingAttachment[];
};
export default function ItemForm({ action, values = {}, mode, }: {
  action: (formData: FormData) => void | Promise<void>;
  values?: Values;
  mode: "create" | "edit";
}) {
  const [type, setType] = useState(values.type ?? "ACTIVITY");
  const [visibility, setVisibility,] = useState(values.visibility ?? "KU_ONLY");
  const [errors, setErrors,] = useState<Record<string, string>>({});
  const field = "min-h-11 w-full rounded-xl border bg-paper px-3 py-2.5 text-sm outline-none";
  const ok = "border-line focus:border-brand";
  const bad = "border-danger bg-dangersoft/40";
  const [dateMode, setDateMode] = useState<"none" | "deadline" | "period" | "both">(values.deadlineAt ? (values.eventStart ? "both" : "deadline") : values.eventStart ? "period" : "none");
  const [archivePolicy, setArchivePolicy] = useState<"AUTO" | "CUSTOM" | "NEVER">(values.archivePolicy ?? (values.expiresAt ? "CUSTOM" : mode === "edit" ? "NEVER" : "AUTO"));
  const [deadlineAt, setDeadlineAt] = useState(values.deadlineAt ?? "");
  const [deadlineLabel, setDeadlineLabel] = useState(values.deadlineLabel ?? "กำหนดส่ง");
  const [eventStart, setEventStart] = useState(values.eventStart ?? "");
  const [eventEnd, setEventEnd] = useState(values.eventEnd ?? "");
  const [eventLabel, setEventLabel] = useState(values.eventLabel ?? "ช่วงเหตุการณ์");
  const [expiresAt, setExpiresAt] = useState(values.expiresAt ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const preview = importantDate({
    deadlineAt: (dateMode === "deadline" || dateMode === "both") && deadlineAt ? `${deadlineAt}T23:59:59+07:00` : null,
    deadlineLabel,
    eventStart: (dateMode === "period" || dateMode === "both") && eventStart ? `${eventStart}:00+07:00` : null,
    eventEnd: (dateMode === "period" || dateMode === "both") && eventEnd ? `${eventEnd}:00+07:00` : null,
    eventLabel,
  });
  function check(e: React.FormEvent<HTMLFormElement>): boolean {
    const next = validateItemForm(new FormData(e.currentTarget));
    if (Object.keys(next).length > 0) {
      e.preventDefault();
      setErrors(next);
      return false;
    }
    setErrors({});
    return true;
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || !check(e))
      return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const files = fd.getAll("attachments").filter((v): v is File => v instanceof File && v.size > 0);
    setSubmitting(true);
    try {
      const uploaded = await uploadDirect(files);
      fd.delete("attachments");
      fd.set("directUploads", JSON.stringify(uploaded));
      await action(fd);
    }
    catch (err) {
      setErrors({ server: err instanceof Error ? err.message : "บันทึกไม่สำเร็จ" });
      setSubmitting(false);
    }
  }
  return (<form action={action} onSubmit={submit} className="space-y-5">
    {values.id && (<input type="hidden" name="id" value={values.id} />)}
    {Object.keys(errors).length > 0 && (<div role="alert" className="rounded-xl bg-dangersoft px-4 py-3 text-sm text-danger">
      <p>
        บันทึกไม่สำเร็จ · พบ{" "}
        {Object.keys(errors).length}{" "}
        จุดที่ต้องแก้
      </p>

      {errors.server && <p className="mt-1 text-xs">{errors.server}</p>}
      {errors.attachments && (<p className="mt-1 text-xs">
        {errors.attachments}
      </p>)}
    </div>)}
    <fieldset className="axis-panel axis-form-section" aria-labelledby="axis-form-section-main">
      <div id="axis-form-section-main" className="axis-form-section-title">
        <span className="axis-form-section-number">
          1.
        </span>

        <span>
          เนื้อหาหลัก
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <span className="mb-2 block text-sm font-medium">
            ประเภท
          </span>

          <div className="axis-filter-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            {ITEM_TYPES.map((value) => (<button key={value} type="button" onClick={() => setType(value)} className={[
              "min-h-10 shrink-0 rounded-full border px-3 text-xs",
              type ===
                value
                ? "border-brand bg-brandsoft font-medium text-branddeep"
                : "border-line bg-paper text-muted",
            ].join(" ")}>
              {TYPE_LABEL[value]}
            </button>))}
          </div>

          <input type="hidden" name="type" value={type} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            หัวข้อ
          </span>

          <input name="title" defaultValue={values.title} className={`${field} ${errors.title
            ? bad
            : ok}`} aria-invalid={!!errors.title} />

          {errors.title && (<span className="mt-1 block text-xs text-danger">
            {errors.title}
          </span>)}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            เนื้อหา
          </span>

          <textarea name="body" rows={7} defaultValue={values.body} className={`${field} min-h-40 resize-y ${errors.body
            ? bad
            : ok}`} aria-invalid={!!errors.body} />

          {errors.body && (<span className="mt-1 block text-xs text-danger">
            {errors.body}
          </span>)}
        </label>
      </div>
    </fieldset>
    <fieldset className="axis-panel axis-form-section" aria-labelledby="axis-form-section-target">
      <div id="axis-form-section-target" className="axis-form-section-title">
        <span className="axis-form-section-number">
          2.
        </span>

        <span>
          กลุ่มเป้าหมายและเวลา
        </span>
      </div>

      <p className="mb-4 text-xs leading-5 text-muted">
        กลุ่มเป้าหมายและชั้นปีใช้บอกความเกี่ยวข้องของประกาศ
        ส่วนการมองเห็นด้านล่างเป็นตัวควบคุมสิทธิ์การเปิดจริง
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            กลุ่มเป้าหมาย
          </span>

          <select name="audience" defaultValue={values.audience ??
            "ALL"} className={`${field} ${errors.audience
              ? bad
              : ok}`}>
            {AUDIENCES.map((value) => (<option key={value} value={value}>
              {AUDIENCE_LABEL[value]}
            </option>))}
          </select>

          {errors.audience && (<span className="mt-1 block text-xs text-danger">
            {errors.audience}
          </span>)}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            ชั้นปีเป้าหมาย
          </span>

          <select name="targetYear" defaultValue={values.targetYear ??
            ""} className={`${field} ${ok}`}>
            <option value="">
              ทุกชั้นปี
            </option>

            {[
              1,
              2,
              3,
              4,
            ].map((year) => (<option key={year} value={year}>
              ปี{" "}
              {year}
            </option>))}
          </select>
        </label>
        <label className="block md:col-span-2 xl:col-span-1">
          <span className="mb-1.5 block text-sm font-medium">
            สถานที่
          </span>

          <input name="location" defaultValue={values.location ??
            ""} className={`${field} ${ok}`} placeholder="เช่น ห้อง S603 หรือออนไลน์" />
        </label>

      </div>
      <div className="mt-5 space-y-4 rounded-2xl border border-line bg-paper p-4">
        <div>
          <p className="text-sm font-medium">วันที่เกี่ยวข้องกับประกาศ</p>
          <p className="mt-1 text-xs leading-5 text-muted">เลือกเฉพาะวันที่ผู้คนต้องรู้ วันที่เผยแพร่ระบบบันทึกให้อัตโนมัติ</p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">ประกาศนี้มีวันที่แบบไหน?</span>
          <select name="dateMode" value={dateMode} onChange={e => setDateMode(e.target.value as typeof dateMode)} className={`${field} ${ok}`}>
            <option value="none">ไม่มีวันที่เฉพาะ</option>
            <option value="deadline">มีกำหนดส่ง / ปิดรับสมัคร</option>
            <option value="period">มีวันหรือช่วงเหตุการณ์</option>
            <option value="both">มีทั้งกำหนดส่งและช่วงเหตุการณ์</option>
          </select>
        </label>
        {(dateMode === "deadline" || dateMode === "both") && (<div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-sm font-medium">วันที่สำคัญ / กำหนดส่ง</span>
            <input type="date" name="deadlineAt" required value={deadlineAt} onChange={e => setDeadlineAt(e.target.value)} className={`${field} ${errors.deadlineAt ? bad : ok}`} />
            {errors.deadlineAt && <span className="mt-1 text-xs text-danger">{errors.deadlineAt}</span>}
          </label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium">ป้ายกำกับวันที่</span>
            <input name="deadlineLabel" maxLength={40} value={deadlineLabel} onChange={e => setDeadlineLabel(e.target.value)} placeholder="เช่น ปิดรับสมัคร / กำหนดส่ง" className={`${field} ${ok}`} />
          </label>
        </div>)}
        {(dateMode === "period" || dateMode === "both") && (<div className="grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-sm font-medium">เริ่มเหตุการณ์</span>
            <input type="datetime-local" name="eventStart" required value={eventStart} onChange={e => setEventStart(e.target.value)} className={`${field} ${errors.eventStart ? bad : ok}`} />
            {errors.eventStart && <span className="mt-1 text-xs text-danger">{errors.eventStart}</span>}
          </label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium">สิ้นสุดเหตุการณ์ (ไม่บังคับ)</span>
            <input type="datetime-local" name="eventEnd" value={eventEnd} min={eventStart || undefined} onChange={e => setEventEnd(e.target.value)} className={`${field} ${errors.eventEnd ? bad : ok}`} />
            {errors.eventEnd && <span className="mt-1 text-xs text-danger">{errors.eventEnd}</span>}
          </label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">ป้ายกำกับช่วงเวลา (ไม่บังคับ)</span>
            <input name="eventLabel" maxLength={40} value={eventLabel} onChange={e => setEventLabel(e.target.value)} placeholder="เช่น งดใช้งาน / วันจัดกิจกรรม" className={`${field} ${ok}`} />
          </label>
        </div>)}
        <div className="rounded-xl bg-brandsoft px-3 py-3 text-sm text-branddeep" aria-live="polite">
          <span className="font-medium">ตัวอย่างวันที่ที่ผู้อ่านจะเห็น: </span>
          {preview ? `${preview.label} · ${preview.text}` : dateMode === "none" ? "ไม่แสดงวันที่สำคัญ" : "กรุณาเลือกวันที่"}
        </div>
      </div>

      <details className="mt-4 rounded-2xl border border-line bg-paper p-4">
        <summary className="cursor-pointer text-sm font-medium">ตั้งค่าขั้นสูง · เก็บประกาศเข้าคลังย้อนหลัง</summary>
        <p className="mt-2 text-xs leading-5 text-muted">วันที่นี้ใช้จัดการสถานะประกาศ ไม่ใช่วันปิดรับสมัครหรือวันที่บนหนังสือ</p>
        <label className="mt-3 block"><span className="mb-1.5 block text-sm font-medium">เก็บเข้าคลังเมื่อใด?</span>
          <select name="archivePolicy" value={archivePolicy} onChange={e => setArchivePolicy(e.target.value as typeof archivePolicy)} className={`${field} ${ok}`}>
            <option value="AUTO">อัตโนมัติหลังวันสุดท้ายของเหตุการณ์ หรือวันกำหนดส่ง</option>
            <option value="CUSTOM">กำหนดวันที่เอง</option>
            <option value="NEVER">ไม่เก็บอัตโนมัติ (ปิดประกาศเอง)</option>
          </select>
        </label>
        {archivePolicy === "CUSTOM" && <label className="mt-3 block"><span className="mb-1.5 block text-sm font-medium">วันเก็บเข้าคลัง</span>
          <input type="date" name="expiresAt" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} required className={`${field} ${errors.expiresAt ? bad : ok}`} />
          {errors.expiresAt && <span className="mt-1 text-xs text-danger">{errors.expiresAt}</span>}
        </label>}
        {archivePolicy === "AUTO" && <p className="mt-2 text-xs text-muted">ถ้าไม่มีวันกำหนดส่งหรือวันเหตุการณ์ ประกาศจะคงอยู่จนกว่า Editor จะสั่งปิด</p>}
      </details>
    </fieldset>
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
    <fieldset className="axis-panel axis-form-section" aria-labelledby="axis-form-section-access">
      <div id="axis-form-section-access" className="axis-form-section-title">
        <span className="axis-form-section-number">
          4.
        </span>

        <span>
          การมองเห็นและสถานะ
        </span>
      </div>

      <p className="mb-3 text-xs leading-5 text-muted">
        การมองเห็นคือการควบคุมสิทธิ์การเข้าถึงจริง
        ค่าเริ่มต้นเป็นเฉพาะบัญชีมหาวิทยาลัย
        เพื่อป้องกันการเปิดข้อมูลภายในโดยไม่ตั้งใจ
      </p>

      <input type="hidden" name="visibility" value={visibility} />

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            v: "KU_ONLY",
            t: "🔒 เฉพาะบัญชีมหาวิทยาลัย",
            d: "ค่าเริ่มต้น ปลอดภัยไว้ก่อน",
          },
          {
            v: "PUBLIC",
            t: "🌏 ทุกคน",
            d: "ใช้เมื่อข้อมูลเปิดให้คนนอกได้จริง",
          },
        ].map((option) => (<button key={option.v} type="button" onClick={() => setVisibility(option.v)} className={[
          "min-h-24 rounded-xl bg-paper p-4 text-left text-sm ring-1",
          visibility ===
            option.v
            ? "ring-2 ring-brand"
            : "ring-line/60",
        ].join(" ")}>
          <span className="font-medium">
            {option.t}
          </span>

          <span className="mt-1 block text-xs leading-5 text-muted">
            {option.d}
          </span>
        </button>))}
      </div>
      {mode ===
        "create" ||
        values.status ===
        "DRAFT" ? (<label className="mt-4 block max-w-sm">
          <span className="mb-1.5 block text-sm font-medium">
            สถานะ
          </span>

          <select name="status" defaultValue={values.status ??
            "DRAFT"} className={`${field} ${ok}`}>
            <option value="DRAFT">
              บันทึกร่าง
            </option>

            <option value="PUBLISHED">
              เผยแพร่
            </option>
          </select>
        </label>) : (<input type="hidden" name="status" value={values.status ??
          "PUBLISHED"} />)}
    </fieldset>
    <div className="sticky bottom-[4.25rem] z-10 rounded-2xl border border-line bg-paper/95 p-3 shadow-lg backdrop-blur md:bottom-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="text-xs text-muted">
          ตรวจกลุ่มเป้าหมาย
          การมองเห็น
          และวันที่อีกครั้งก่อนบันทึก
        </p>

        <button disabled={submitting} className="min-h-11 rounded-xl bg-brand px-5 text-sm text-white disabled:opacity-60 sm:ml-auto sm:min-w-44">
          {submitting ? "กำลังอัปโหลด / บันทึก..." : mode === "create" ? "บันทึกประกาศ" : "บันทึกการแก้ไข"}
        </button>
      </div>
    </div>
  </form>);
}
