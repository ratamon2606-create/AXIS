"use client";

import { useEffect, useRef, useState } from "react";

type Image = {
  id: string;
  fileName: string;
};

function GalleryImage({ image }: { image: Image }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);

  const url =
    "/api/files/" +
    encodeURIComponent(image.id) +
    "?view=1" +
    (attempt > 0 ? "&retry=" + attempt : "");

  useEffect(() => {
    const element = imageRef.current;

    // รองรับรูปที่โหลดล้มเหลวก่อน React พร้อมรับ onError
    if (element?.complete && element.naturalWidth === 0) {
      setFailed(true);
    }
  }, [attempt]);

  function retry() {
    setAttempt((current) => current + 1);
    setFailed(false);
  }

  if (failed) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 px-12 text-center sm:h-96">
        <p role="status" className="text-sm text-muted">
          โหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง
        </p>
        <button
          type="button"
          onClick={retry}
          className="rounded-xl bg-brand px-4 py-2 text-sm text-white"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        key={attempt}
        src={url}
        alt={image.fileName}
        onError={() => setFailed(true)}
        className="h-64 w-full object-contain sm:h-96"
      />
    </a>
  );
}

export function ImageCarousel({
  images,
  initialImageId,
}: {
  images: Image[];
  initialImageId?: string | null;
}) {
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      images.findIndex((image) => image.id === initialImageId)
    )
  );

  useEffect(() => {
    setIndex((current) =>
      Math.max(0, Math.min(current, images.length - 1))
    );
  }, [images.length]);

  useEffect(() => {
    setIndex(
      Math.max(
        0,
        images.findIndex((image) => image.id === initialImageId)
      )
    );
  }, [initialImageId]);

  if (!images.length) return null;

  const active = images[index] ?? images[0];

  const toImage = (id: string) =>
    "/api/files/" + encodeURIComponent(id) + "?view=1";

  return (
    <section aria-label="รูปภาพประกาศ" className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-line/70 bg-wash">
        <GalleryImage key={active.id} image={active} />

        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2">
            <button
              type="button"
              aria-label="ภาพก่อนหน้า"
              onClick={() =>
                setIndex(
                  (current) =>
                    (current + images.length - 1) % images.length
                )
              }
              className="pointer-events-auto rounded-full bg-paper/90 px-3 py-2 text-lg shadow"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="ภาพถัดไป"
              onClick={() =>
                setIndex((current) => (current + 1) % images.length)
              }
              className="pointer-events-auto rounded-full bg-paper/90 px-3 py-2 text-lg shadow"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <span className="min-w-0 truncate">{active.fileName}</span>
        <span aria-live="polite" className="shrink-0">
          {index + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          role="group"
          aria-label="เลือกภาพ"
        >
          {images.map((image, position) => (
            <button
              key={image.id}
              type="button"
              aria-label={"ดูภาพ " + (position + 1)}
              aria-pressed={index === position}
              onClick={() => setIndex(position)}
              className={[
                "h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-wash",
                index === position
                  ? "border-brand"
                  : "border-transparent",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={toImage(image.id)}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}