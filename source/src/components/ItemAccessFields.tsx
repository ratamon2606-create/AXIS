"use client";
import { useState } from "react";

export function ItemAccessFields({
  initialVisibility = "KU_ONLY", status, mode, field, ok,
}: {
  initialVisibility?: string;
  status?: string;
  mode: "create" | "edit";
  field: string;
  ok: string;
}) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const values = { status };
  return (
    <>
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
    </>
  );
}
