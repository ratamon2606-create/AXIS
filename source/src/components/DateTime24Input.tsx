"use client";

import { joinDateTime24, splitDateTime24 } from "@/lib/datetime-24";

type DateTime24InputProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  min?: string;
  className?: string;
};

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0"));

/**
 * Native datetime-local controls can show AM/PM depending on browser locale.
 * Explicit 00-23 hour and 00-59 minute selects keep the UI consistent.
 * The hidden input preserves the existing server action's field name and value.
 */
export default function DateTime24Input({
  name,
  value,
  onChange,
  required = false,
  min,
  className = "",
}: DateTime24InputProps) {
  const { date, hour, minute } = splitDateTime24(value);
  const minDate = min ? splitDateTime24(min).date : undefined;

  function update(nextDate: string, nextHour: string, nextMinute: string) {
    onChange(joinDateTime24(nextDate, nextHour, nextMinute));
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_5.3rem_5.3rem]">
        <input
          type="date"
          aria-label="วันที่"
          required={required}
          value={date}
          min={minDate}
          onChange={(event) => update(event.target.value, hour, minute)}
          className={className}
        />
        <select
          aria-label="ชั่วโมง (00–23)"
          value={hour}
          disabled={!date}
          onChange={(event) => update(date, event.target.value, minute)}
          className={className}
        >
          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <select
          aria-label="นาที (00–59)"
          value={minute}
          disabled={!date}
          onChange={(event) => update(date, hour, event.target.value)}
          className={className}
        >
          {MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <p className="mt-1 text-xs text-muted">เวลา 24 ชั่วโมง (ประเทศไทย) · ชั่วโมง : นาที</p>
    </>
  );
}
