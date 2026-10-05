"use client";

import { useState, useTransition } from "react";
import { saveItem, unsaveItem } from "@/app/actions/saved";

export default function SaveButton({ itemId, initialSaved }: { itemId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      if (saved) await unsaveItem(itemId);
      else await saveItem(itemId);
      setSaved(!saved);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`grid h-10 w-10 place-items-center rounded-full border text-lg ${saved ? "border-amber bg-ambersoft text-amber" : "border-line bg-paper text-muted"}`}
      aria-label={saved ? "ยกเลิกการบันทึก" : "บันทึกประกาศ"}
    >
      {saved ? "★" : "☆"}
    </button>
  );
}
