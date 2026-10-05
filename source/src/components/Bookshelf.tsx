"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SaveButton from "@/components/SaveButton";
import { AUDIENCE_LABEL, TYPE_LABEL } from "@/lib/items";

type ShelfItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  audience: string;
  targetYear: number | null;
  eventStart: string | null;
  expiresAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  location: string | null;
  saved: boolean;
};

const TYPES = ["ALL", "NEWS", "OPPORTUNITY", "ACTIVITY", "ALERT", "DOCUMENT"] as const;

function relevantMs(item: ShelfItem) {
  const raw = item.type === "ACTIVITY"
    ? item.eventStart
    : item.type === "OPPORTUNITY"
      ? item.expiresAt
      : item.publishedAt ?? item.createdAt;
  return new Date(raw ?? item.createdAt).getTime();
}

function sortForShelf(items: ShelfItem[], type: string) {
  return [...items].sort((a, b) => {
    if (type === "ACTIVITY" || type === "OPPORTUNITY") return relevantMs(a) - relevantMs(b);
    return relevantMs(b) - relevantMs(a);
  });
}

function displayDate(item: ShelfItem) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(new Date(relevantMs(item)));
}

export default function Bookshelf({ items }: { items: ShelfItem[] }) {
  const [type, setType] = useState<(typeof TYPES)[number]>("ALL");
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<"shelf" | "list">("shelf");

  const filtered = useMemo(() => {
    const picked = type === "ALL" ? items : items.filter((item) => item.type === type);
    return sortForShelf(picked, type);
  }, [items, type]);

  const safeIndex = filtered.length ? Math.min(index, filtered.length - 1) : 0;
  const selected = filtered[safeIndex];

  function changeType(next: (typeof TYPES)[number]) {
    setType(next);
    setIndex(0);
  }

  function move(step: number) {
    if (!filtered.length) return;
    setIndex((current) => (current + step + filtered.length) % filtered.length);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {TYPES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => changeType(value)}
            className={`rounded-full border px-3 py-1.5 text-xs ${
              type === value ? "border-brand bg-brandsoft font-medium text-branddeep" : "border-line bg-paper text-muted"
            }`}
          >
            {value === "ALL" ? "ทั้งหมด" : TYPE_LABEL[value]}
          </button>
        ))}
        <div className="ml-auto flex rounded-xl bg-paper p-1 ring-1 ring-line/60">
          <button type="button" onClick={() => setView("shelf")} className={`rounded-lg px-3 py-1 text-xs ${view === "shelf" ? "bg-brandsoft text-branddeep" : "text-muted"}`}>ชั้นหนังสือ</button>
          <button type="button" onClick={() => setView("list")} className={`rounded-lg px-3 py-1 text-xs ${view === "list" ? "bg-brandsoft text-branddeep" : "text-muted"}`}>รายการ</button>
        </div>
      </div>

      {!selected ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">ไม่มีประกาศในหมวดนี้</p>
      ) : view === "list" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`} className="rounded-2xl bg-paper p-4 ring-1 ring-line/60">
              <span className="text-[11px] text-muted">{TYPE_LABEL[item.type]} · {displayDate(item)}</span>
              <h2 className="mt-1 text-sm font-medium">{item.title}</h2>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{item.body}</p>
            </Link>
          ))}
        </div>
      ) : (
        <>
          <div className="axis-book-stage">
            {filtered.map((item, itemIndex) => {
              const offset = itemIndex - safeIndex;
              if (Math.abs(offset) > 2) return null;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setIndex(itemIndex)}
                  className={`axis-book axis-book-${item.type.toLowerCase()} ${offset === 0 ? "axis-book-selected" : ""}`}
                  style={{ "--offset": offset } as React.CSSProperties}
                >
                  <span className="text-xs opacity-70">{displayDate(item)}</span>
                  <strong className="mt-5 block text-left text-lg leading-snug">{item.title}</strong>
                  <span className="absolute bottom-4 left-4 text-[10px] opacity-70">{TYPE_LABEL[item.type]}</span>
                  {item.saved && <span className="axis-book-ribbon">★</span>}
                </button>
              );
            })}
          </div>
          <div className="axis-shelf" />

          <div className="mx-auto max-w-2xl rounded-3xl bg-paper p-5 ring-1 ring-line/60">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{TYPE_LABEL[selected.type]} · {AUDIENCE_LABEL[selected.audience]} · {displayDate(selected)}</p>
                <h2 className="mt-1 text-lg font-medium">{selected.title}</h2>
              </div>
              <SaveButton itemId={selected.id} initialSaved={selected.saved} />
            </div>
            <p className="mt-3 text-sm leading-7 text-muted">{selected.body.slice(0, 260)}{selected.body.length > 260 ? "…" : ""}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
              {selected.location && <span className="rounded-full bg-wash px-3 py-1">📍 {selected.location}</span>}
              {selected.targetYear && <span className="rounded-full bg-wash px-3 py-1">ปี {selected.targetYear}</span>}
            </div>
            <Link href={`/items/${selected.id}`} className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2 text-sm text-white">เปิดประกาศ →</Link>
          </div>

          <div className="flex justify-center gap-2">
            {filtered.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                aria-label={`ไปที่รายการ ${itemIndex + 1}`}
                className={`h-2 rounded-full transition-all ${itemIndex === safeIndex ? "w-7 bg-brand" : "w-2 bg-line"}`}
              />
            ))}
          </div>
          <div className="flex justify-center gap-6">
            <button type="button" onClick={() => move(-1)} className="w-28 rounded-full border border-line bg-paper py-2 text-sm">←</button>
            <button type="button" onClick={() => move(1)} className="w-28 rounded-full border border-line bg-paper py-2 text-sm">→</button>
          </div>
        </>
      )}
    </section>
  );
}
