"use client";

import { useState } from "react";
import { TYPE_LABEL, TYPE_FIELDS } from "@/lib/items";

type Values = {
  id?: string;
  title?: string;
  body?: string;
  type?: string;
  department?: string;
  visibility?: string;
  imageUrl?: string;
  details?: Record<string, string>;
};

const TYPES = ["NEWS", "OPPORTUNITY", "ACTIVITY", "ALERT", "DOCUMENT"];

export default function ItemForm({
  action,
  values = {},
  mode,
}: {
  action: (formData: FormData) => void;
  values?: Values;
  mode: "create" | "edit";
}) {
  const [type, setType] = useState(values.type ?? "ACTIVITY");
  const [visibility, setVisibility] = useState(values.visibility ?? "KU_ONLY");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const field = "w-full rounded-xl border bg-paper px-3 py-2.5 text-sm outline-none";
  const ok = "border-line focus:border-brand";
  const bad = "border-danger bg-dangersoft/40";

  /** ตรวจฝั่งหน้าเว็บเพื่อบอกผู้ใช้ทันที ส่วน server action ตรวจซ้ำอีกชั้นเสมอ */
  function check(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    if (!String(fd.get("title") ?? "").trim()) next.title = "ต้องมีหัวข้อก่อนบันทึก";
    if (!String(fd.get("body") ?? "").trim()) next.body = "ต้องมีเนื้อหาก่อนบันทึก";
    const d = String(fd.get("department") ?? "");
    if (d !== "CPE" && d !== "SKE") next.department = "ต้องเลือกภาควิชาก่อนบันทึก";

    if (Object.keys(next).length) {
      e.preventDefault();
      setErrors(next);
      return;
    }
    setErrors({});
  }

  return (
    <form action={action} onSubmit={check} className="space-y-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      {Object.keys(errors).length > 0 && (
        <p className="rounded-xl bg-dangersoft px-3 py-2.5 text-sm text-danger">
          บันทึกไม่สำเร็จ · ยังไม่ได้กรอก {Object.keys(errors).length} ช่อง
        </p>
      )}

      <div>
        <span className="mb-1.5 block text-sm font-medium">ประเภท</span>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full border px-3 py-1 text-xs ${
                type === t
                  ? "border-brand bg-brandsoft font-medium text-branddeep"
                  : "border-line bg-paper text-muted"
              }`}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">หัวข้อ</span>
        <input
          name="title"
          defaultValue={values.title}
          className={`${field} ${errors.title ? bad : ok}`}
        />
        {errors.title && <span className="mt-1 block text-xs text-danger">{errors.title}</span>}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">เนื้อหา</span>
        <textarea
          name="body"
          rows={4}
          defaultValue={values.body}
          className={`${field} ${errors.body ? bad : ok}`}
        />
        {errors.body && <span className="mt-1 block text-xs text-danger">{errors.body}</span>}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">ภาควิชา</span>
        <select
          name="department"
          defaultValue={values.department ?? ""}
          className={`${field} ${errors.department ? bad : ok}`}
        >
          <option value="">เลือกภาควิชา</option>
          <option value="CPE">CPE</option>
          <option value="SKE">SKE</option>
        </select>
        {errors.department && (
          <span className="mt-1 block text-xs text-danger">{errors.department}</span>
        )}
      </label>

      <div className="rounded-xl bg-brandsoft px-3 py-2.5 text-xs leading-6 text-branddeep">
        ช่องข้างล่างเปลี่ยนตามประเภทที่เลือก · ตอนนี้คือ {TYPE_LABEL[type]}
      </div>

      {(TYPE_FIELDS[type] ?? []).map((f) => (
        <label key={f.key} className="block">
          <span className="mb-1.5 block text-sm font-medium">{f.label}</span>
          <input
            name={`d_${f.key}`}
            defaultValue={values.details?.[f.key] ?? ""}
            className={`${field} ${ok}`}
          />
        </label>
      ))}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">ลิงก์รูปโปสเตอร์</span>
        <input
          name="imageUrl"
          placeholder="https://"
          defaultValue={values.imageUrl ?? ""}
          className={`${field} ${ok}`}
        />
        <span className="mt-1 block text-xs text-muted">
          การอัปโหลดไฟล์จริงเลื่อนไป iteration 2
        </span>
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-medium">ใครเห็นประกาศนี้ได้</span>
        <input type="hidden" name="visibility" value={visibility} />
        {[
          {
            v: "KU_ONLY",
            t: "🔒 เฉพาะบัญชีมหาวิทยาลัย",
            d: "ค่าเริ่มต้น ลืมเลือกก็ปลอดภัยไว้ก่อน",
          },
          {
            v: "PUBLIC",
            t: "🌏 ทุกคน",
            d: "ใช้เมื่อคนนอกภาคเข้าร่วมได้ เช่น ประกวดระดับมหาวิทยาลัย",
          },
        ].map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setVisibility(o.v)}
            className={`mb-2 flex w-full gap-3 rounded-xl bg-paper p-3 text-left text-sm ring-1 ${
              visibility === o.v ? "ring-2 ring-brand" : "ring-line/60"
            }`}
          >
            <span
              className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                visibility === o.v ? "border-[5px] border-brand" : "border-line"
              }`}
            />
            <span>
              {o.t}
              <span className="mt-0.5 block text-xs text-muted">{o.d}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        {mode === "create" && (
          <button
            name="publish"
            value="0"
            className="flex-1 rounded-xl border border-line py-2.5 text-sm"
          >
            บันทึกร่าง
          </button>
        )}
        <button
          name="publish"
          value="1"
          className="flex-1 rounded-xl bg-brand py-2.5 text-sm text-white"
        >
          {mode === "create" ? "เผยแพร่" : "บันทึกการแก้ไข"}
        </button>
      </div>
    </form>
  );
}
