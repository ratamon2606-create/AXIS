"use client";
import { useState } from "react";
import DateTime24Input from "@/components/DateTime24Input";
import { importantDate } from "@/lib/smart-dates";
import type { ArchivePolicy, DateMode } from "@/lib/smart-dates";

export type SmartDateFormValues = {
  deadlineAt?: string;
  deadlineLabel?: string;
  eventStart?: string;
  eventEnd?: string;
  eventLabel?: string;
  archivePolicy?: ArchivePolicy;
  expiresAt?: string;
};

/** The editor's date/archive state is isolated from content and attachment state. */
export function SmartDateFields({
  values, mode, errors, field, ok, bad,
}: {
  values: SmartDateFormValues;
  mode: "create" | "edit";
  errors: Record<string, string>;
  field: string;
  ok: string;
  bad: string;
}) {
  const [dateMode, setDateMode] = useState<DateMode>(values.deadlineAt ? (values.eventStart ? "both" : "deadline") : values.eventStart ? "period" : "none");
  const [archivePolicy, setArchivePolicy] = useState<ArchivePolicy>(values.archivePolicy ?? (values.expiresAt ? "CUSTOM" : mode === "edit" ? "NEVER" : "AUTO"));
  const [deadlineAt, setDeadlineAt] = useState(values.deadlineAt ?? "");
  const [deadlineLabel, setDeadlineLabel] = useState(values.deadlineLabel ?? "กำหนดส่ง");
  const [eventStart, setEventStart] = useState(values.eventStart ?? "");
  const [eventEnd, setEventEnd] = useState(values.eventEnd ?? "");
  const [eventLabel, setEventLabel] = useState(values.eventLabel ?? "ช่วงเหตุการณ์");
  const [expiresAt, setExpiresAt] = useState(values.expiresAt ?? "");
  const preview = importantDate({
    deadlineAt: (dateMode === "deadline" || dateMode === "both") && deadlineAt ? `${deadlineAt}T23:59:59+07:00` : null,
    deadlineLabel,
    eventStart: (dateMode === "period" || dateMode === "both") && eventStart ? `${eventStart}:00+07:00` : null,
    eventEnd: (dateMode === "period" || dateMode === "both") && eventEnd ? `${eventEnd}:00+07:00` : null,
    eventLabel,
  });
  return (
    <>
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
            <DateTime24Input name="eventStart" required value={eventStart} onChange={setEventStart} className={`${field} ${errors.eventStart ? bad : ok}`} />
            {errors.eventStart && <span className="mt-1 text-xs text-danger">{errors.eventStart}</span>}
          </label>
          <label className="block"><span className="mb-1.5 block text-sm font-medium">สิ้นสุดเหตุการณ์ (ไม่บังคับ)</span>
            <DateTime24Input name="eventEnd" value={eventEnd} min={eventStart || undefined} onChange={setEventEnd} className={`${field} ${errors.eventEnd ? bad : ok}`} />
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
    </>
  );
}
