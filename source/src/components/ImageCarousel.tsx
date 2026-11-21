"use client";

import { useEffect, useRef, useState } from "react";

type Image = {
  id: string;
  fileName: string;
};

type GalleryImageProps = {
  image: Image;
  retryVersion: number;
  onRetry: () => void;
  thumbnail?: boolean;
};

function GalleryImage({
  image,
  retryVersion,
  onRetry,
  thumbnail = false,
}: GalleryImageProps) {
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const url =
    "/api/files/" +
    encodeURIComponent(image.id) +
    "?view=1" +
    (retryVersion > 0 ? "&retry=" + retryVersion : "");

  useEffect(() => {
    const element = imageRef.current;

    // ตรวจรูปที่โหลดล้มเหลวก่อน React พร้อมรับ onError
    if (element?.complete && element.naturalWidth === 0) {
      setFailed(true);
    }
  }, [url]);

  if (failed) {
    if (thumbnail) {
      return (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-muted"
        >
          โหลดรูปไม่ได้
        </span>
      );
    }

    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 px-12 text-center sm:h-96">
        <p role="status" className="text-sm text-muted">
          โหลดรูปไม่สำเร็จ กรุณาลองอีกครั้ง
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-brand px-4 py-2 text-sm text-white"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  const picture = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={url}
      alt={thumbnail ? "" : image.fileName}
      loading={thumbnail ? "lazy" : "eager"}
      onError={() => setFailed(true)}
      className={
        thumbnail
          ? "h-full w-full object-cover"
          : "h-64 w-full object-contain sm:h-96"
      }
    />
  );

  if (thumbnail) return picture;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      {picture}
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
  const [retryVersion, setRetryVersion] = useState(0);

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

  function retryAllImages() {
    setRetryVersion((current) => current + 1);
  }

  if (!images.length) return null;

  const active = images[index] ?? images[0];

  return (
    <section aria-label="รูปภาพประกาศ" className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-line/70 bg-wash">
        <GalleryImage
          key={`${active.id}:${retryVersion}`}
          image={active}
          retryVersion={retryVersion}
          onRetry={retryAllImages}
        />

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

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="min-w-0 flex-1 truncate">
          {active.fileName}
        </span>
        <span aria-live="polite" className="shrink-0">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={retryAllImages}
          aria-label="โหลดรูปหลักและรูปย่อใหม่"
          className="shrink-0 rounded-lg border border-line bg-paper px-3 py-2 text-branddeep"
        >
          โหลดรูปใหม่
        </button>
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
              <GalleryImage
                key={`${image.id}:${retryVersion}`}
                image={image}
                retryVersion={retryVersion}
                onRetry={retryAllImages}
                thumbnail
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}