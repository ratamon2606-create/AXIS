"use client";

import { useState } from "react";
import { AUDIENCE_LABEL, TYPE_FIELDS, TYPE_LABEL } from "@/lib/items";
import { removeAttachment } from "@/app/actions/attachments";

type ExistingAttachment = { id: string; fileName: string; size: number };

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
  expiresAt?: string;
  location?: string;
  details?: Record<string, string>;
  attachments?: ExistingAttachment[];
};

const TYPES = ["NEWS", "OPPORTUNITY", "ACTIVITY", "ALERT", "DOCUMENT"];
const AUDIENCES = ["ALL", "CPE", "SKE", "CPE_SKE"];

export default function ItemForm({
  action,
  values = {},
  mode,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values?: Values;
  mode: "create" | "edit";
}) {
  const [type, setType] = useState(values.type ?? "ACTIVITY");
  const [visibility, setVisibility] = useState(values.visibility ?? "KU_ONLY");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const field = "w-full rounded-xl border bg-paper px-3 py-2.5 text-sm outline-none";
  const ok = "border-line focus:border-brand";
  const bad = "border-danger bg-dangersoft/40";

  function check(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    if (!String(fd.get("title") ?? "").trim()) next.title = "ต้องมีหัวข้อก่อนบันทึก";
    if (!String(fd.get("body") ?? "").trim()) next.body = "ต้องมีเนื้อหาก่อนบันทึก";
    if (!AUDIENCES.includes(String(fd.get("audience") ?? ""))) {
      next.audience = "ต้องเลือกกลุ่มเป้าหมาย";
    }
    if (Object.keys(next).length) {
      e.preventDefault();
      setErrors(next);
      return;
    }
    setErrors({});
  }

  return (
    <form action={action} onSubmit={check} className="space-y-4" encType="multipart/form-data">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      {Object.keys(errors).length > 0 && (
        <p className="rounded-xl bg-dangersoft px-3 py-2.5 text-sm text-danger">
          บันทึกไม่สำเร็จ · ยังไม่ได้กรอก {Object.keys(errors).length} ช่อง
        </p>
      )}

      <div>
        <span className="mb-1.5 block text-sm font-medium">ประเภท</span>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-full border px-3 py-1 text-xs ${
                type === value
                  ? "border-brand bg-brandsoft font-medium text-branddeep"
                  : "border-line bg-paper text-muted"
              }`}
            >
              {TYPE_LABEL[value]}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">หัวข้อ</span>
        <input name="title" defaultValue={values.title} className={`${field} ${errors.title ? bad : ok}`} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">เนื้อหา</span>
        <textarea name="body" rows={6} defaultValue={values.body} className={`${field} ${errors.body ? bad : ok}`} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">กลุ่มเป้าหมาย</span>
          <select name="audience" defaultValue={values.audience ?? "ALL"} className={`${field} ${errors.audience ? bad : ok}`}>
            {AUDIENCES.map((value) => (
              <option key={value} value={value}>{AUDIENCE_LABEL[value]}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">ชั้นปีเป้าหมาย</span>
          <select name="targetYear" defaultValue={values.targetYear ?? ""} className={`${field} ${ok}`}>
            <option value="">ทุกชั้นปี</option>
            {[1, 2, 3, 4].map((year) => <option key={year} value={year}>ปี {year}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">สถานที่</span>
          <input name="location" defaultValue={values.location ?? ""} className={`${field} ${ok}`} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">เริ่มกิจกรรม</span>
          <input type="datetime-local" name="eventStart" defaultValue={values.eventStart ?? ""} className={`${field} ${ok}`} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">จบกิจกรรม</span>
          <input type="datetime-local" name="eventEnd" defaultValue={values.eventEnd ?? ""} className={`${field} ${ok}`} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">วันหมดเขต</span>
          <input type="date" name="expiresAt" defaultValue={values.expiresAt ?? ""} className={`${field} ${ok}`} />
        </label>
      </div>

      <div className="rounded-xl bg-brandsoft px-3 py-2.5 text-xs leading-6 text-branddeep">
        ช่องเสริมด้านล่างเปลี่ยนตามประเภท · {TYPE_LABEL[type]}
      </div>
      {(TYPE_FIELDS[type] ?? []).map((f) => (
        <label key={f.key} className="block">
          <span className="mb-1.5 block text-sm font-medium">{f.label}</span>
          <input name={`d_${f.key}`} defaultValue={values.details?.[f.key] ?? ""} className={`${field} ${ok}`} />
        </label>
      ))}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">ไฟล์แนบ / รูปภาพ</span>
        <input type="file" name="attachments" multiple className={`${field} ${ok}`} />
        <span className="mt-1 block text-xs text-muted">เพิ่มไฟล์ได้ก่อนเผยแพร่ · สูงสุด 20 MB ต่อไฟล์</span>
      </label>

      {values.attachments && values.attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">ไฟล์ปัจจุบัน</p>
          {values.attachments.map((file) => (
            <div key={file.id} className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2 ring-1 ring-line/60">
              <span className="min-w-0 flex-1 truncate text-sm">{file.fileName}</span>
              <button
                type="submit"
                formAction={async () => {
                  const data = new FormData();
                  data.set("attachmentId", file.id);
                  await removeAttachment(data);
                }}
                className="text-xs text-danger"
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <span className="mb-1.5 block text-sm font-medium">การมองเห็น</span>
        <input type="hidden" name="visibility" value={visibility} />
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { v: "KU_ONLY", t: "🔒 เฉพาะบัญชีมหาวิทยาลัย", d: "ค่าเริ่มต้น ปลอดภัยไว้ก่อน" },
            { v: "PUBLIC", t: "🌏 ทุกคน", d: "ใช้เมื่อคนนอกเข้าถึงได้" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setVisibility(o.v)}
              className={`rounded-xl bg-paper p-3 text-left text-sm ring-1 ${visibility === o.v ? "ring-2 ring-brand" : "ring-line/60"}`}
            >
              <span className="font-medium">{o.t}</span>
              <span className="mt-1 block text-xs text-muted">{o.d}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === "create" || values.status === "DRAFT" ? (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">สถานะ</span>
          <select name="status" defaultValue={values.status ?? "DRAFT"} className={`${field} ${ok}`}>
            <option value="DRAFT">บันทึกร่าง</option>
            <option value="PUBLISHED">เผยแพร่</option>
          </select>
        </label>
      ) : (
        <input type="hidden" name="status" value={values.status ?? "PUBLISHED"} />
      )}

      <button className="w-full rounded-xl bg-brand py-2.5 text-sm text-white">
        {mode === "create" ? "บันทึกประกาศ" : "บันทึกการแก้ไข"}
      </button>
    </form>
  );
}
