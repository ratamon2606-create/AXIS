"use client";

import { useId, useRef, useState } from "react";
import { saveItem, unsaveItem } from "@/app/actions/saved";

type SaveButtonProps = {
  itemId: string;
  initialSaved: boolean;
};

export default function SaveButton({
  itemId,
  initialSaved,
}: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const inFlight = useRef(false);
  const errorId = useId();

  const pendingLabel = saved
    ? "กำลังยกเลิกการบันทึก..."
    : "กำลังบันทึก...";

  async function toggle() {
    // ป้องกันการกดซ้ำก่อนหน้าจออัปเดตสถานะปุ่ม
    if (inFlight.current) return;

    inFlight.current = true;
    setPending(true);
    setError("");
    setStatus("");

    const nextSaved = !saved;

    try {
      if (nextSaved) {
        await saveItem(itemId);
      } else {
        await unsaveItem(itemId);
      }

      // เปลี่ยนดาวเมื่อคำสั่งสำเร็จเท่านั้น
      setSaved(nextSaved);
      setStatus(
        nextSaved
          ? "บันทึกประกาศแล้ว"
          : "ยกเลิกการบันทึกแล้ว"
      );
    } catch {
      setError(
        nextSaved
          ? "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง"
          : "ยกเลิกการบันทึกไม่สำเร็จ กรุณาลองอีกครั้ง"
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  const feedbackClass =
    "absolute right-0 top-full z-20 mt-2 w-56 rounded-xl " +
    "border border-line bg-paper p-3 text-left text-xs " +
    "leading-5 shadow-md";

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-busy={pending}
        aria-pressed={saved}
        aria-describedby={error ? errorId : undefined}
        aria-label={
          pending
            ? pendingLabel
            : saved
              ? "ยกเลิกการบันทึก"
              : "บันทึกประกาศ"
        }
        className={[
          "grid h-10 w-10 place-items-center rounded-full border text-lg",
          "disabled:cursor-wait disabled:opacity-60",
          saved
            ? "border-brand bg-brandsoft text-branddeep"
            : "border-line bg-paper text-muted",
        ].join(" ")}
      >
        <span aria-hidden="true">
          {pending ? "…" : saved ? "★" : "☆"}
        </span>
      </button>

      {pending && (
        <p role="status" className={`${feedbackClass} text-muted`}>
          {pendingLabel}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className={`${feedbackClass} text-danger`}
        >
          {error}
        </p>
      )}

      <span role="status" className="sr-only">
        {status}
      </span>
    </div>
  );
}