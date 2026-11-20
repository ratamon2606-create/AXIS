"use client";
import { useEffect, useState } from "react";

type Image = { id: string; fileName: string };
export function ImageCarousel({ images, initialImageId }: { images: Image[]; initialImageId?: string | null }) {
  const [index, setIndex] = useState(() => Math.max(0, images.findIndex((image) => image.id === initialImageId)));
  useEffect(() => { setIndex((current) => Math.max(0, Math.min(current, images.length - 1))); }, [images.length]);
  if (!images.length) return null;
  const active = images[index] ?? images[0];
  const toImage = (id: string) => "/api/files/" + encodeURIComponent(id) + "?view=1";
  return (
    <section aria-label="รูปภาพประกาศ" className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-line/70 bg-wash">
        <a href={toImage(active.id)} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={toImage(active.id)} alt={active.fileName} className="h-64 w-full object-contain sm:h-96" />
        </a>
        {images.length > 1 && (
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2">
            <button type="button" aria-label="ภาพก่อนหน้า" onClick={() => setIndex((index + images.length - 1) % images.length)} className="rounded-full bg-paper/90 px-3 py-2 text-lg shadow">‹</button>
            <button type="button" aria-label="ภาพถัดไป" onClick={() => setIndex((index + 1) % images.length)} className="rounded-full bg-paper/90 px-3 py-2 text-lg shadow">›</button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="truncate">{active.fileName}</span>
        <span aria-live="polite">{index + 1} / {images.length}</span>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="เลือกภาพ">
          {images.map((image, position) => (
            <button key={image.id} type="button" aria-label={"ดูภาพ " + (position + 1)} aria-pressed={index === position} onClick={() => setIndex(position)}
              className={["h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-wash", index === position ? "border-brand" : "border-transparent"].join(" ")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={toImage(image.id)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
