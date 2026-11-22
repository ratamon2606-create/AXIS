"use client";

import { bookTitleSize, endDate, fullDate, positionVars, shortDate, truncate, type ShelfItem } from "@/lib/bookshelf-utils";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SaveButton from "@/components/SaveButton";
import { relevantDate } from "@/lib/items";

type Props = {
  items: ShelfItem[];
  signedIn: boolean;
};

const FILTERS = [
  ["ALL", "ทั้งหมด"],
  ["NEWS", "ข่าว"],
  ["OPPORTUNITY", "โอกาส"],
  ["ACTIVITY", "กิจกรรม"],
  ["ALERT", "แจ้งเตือน"],
  ["DOCUMENT", "เอกสาร"],
] as const;

const TYPE_LABEL: Record<string, string> = {
  NEWS: "ข่าว",
  OPPORTUNITY: "โอกาส",
  ACTIVITY: "กิจกรรม",
  ALERT: "แจ้งเตือน",
  DOCUMENT: "เอกสาร",
};

export default function Bookshelf({ items, signedIn }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedFilter = searchParams.get("filter");
  const initialFilter = FILTERS.some(([value]) => value === requestedFilter)
    ? requestedFilter!
    : "ALL";

  const initialView =
    searchParams.get("view") === "list"
      ? "list"
      : "shelf";

  const parsedInitialIndex = Number.parseInt(
    searchParams.get("active") ?? "0",
    10,
  );

  const initialActiveIndex =
    Number.isFinite(parsedInitialIndex) && parsedInitialIndex >= 0
      ? parsedInitialIndex
      : 0;

  const [filter, setFilter] = useState(initialFilter);
  const [view, setView] = useState<"shelf" | "list">(initialView);
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

  const filtered = useMemo(() => {
    const result =
      filter === "ALL"
        ? [...items]
        : items.filter((item) => item.type === filter);

    result.sort(
      (a, b) =>
        relevantDate(b).getTime() -
        relevantDate(a).getTime(),
    );

    return result;
  }, [items, filter]);

  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [activeIndex, filtered.length]);

  const active = filtered[activeIndex] ?? null;

  function itemDetailHref(
    itemId: string,
    index: number,
    returnView: "shelf" | "list" = view,
  ) {
    const returnParams = new URLSearchParams({
      filter,
      active: String(index),
      view: returnView,
    });

    const returnTo = `/announcements?${returnParams.toString()}`;

    return `/items/${itemId}?returnTo=${encodeURIComponent(returnTo)}`;
  }

  function selectBook(index: number) {
    if (index === activeIndex) {
      router.push(
        itemDetailHref(
          filtered[index].id,
          index,
          "shelf",
        ),
      );
      return;
    }

    setActiveIndex(index);
  }

  function previous() {
    setActiveIndex((index) => Math.max(0, index - 1));
  }

  function next() {
    setActiveIndex((index) =>
      Math.min(filtered.length - 1, index + 1),
    );
  }

  return (
    <section className="axis-bookshelf-fit space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="axis-filter-scroll flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                  setFilter(value);
                  setActiveIndex(0);
                }}
              aria-pressed={filter === value}
              className={[
                "shrink-0 rounded-full border px-3 py-2 text-xs transition",
                filter === value
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-muted hover:border-brand",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex self-end rounded-full border bg-white p-1">
          <button
            type="button"
            onClick={() => setView("shelf")}
            className={[
              "rounded-full px-3 py-1.5 text-xs",
              view === "shelf" ? "bg-brand text-white" : "text-muted",
            ].join(" ")}
          >
            ชั้นหนังสือ
          </button>

          <button
            type="button"
            onClick={() => setView("list")}
            className={[
              "rounded-full px-3 py-1.5 text-xs",
              view === "list" ? "bg-brand text-white" : "text-muted",
            ].join(" ")}
          >
            รายการ
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="axis-panel p-8 text-center text-sm text-muted">
          ไม่มีข่าวในหมวดนี้
        </div>
      ) : view === "list" ? (
        <div className="space-y-3">
          {filtered.map((item, index) => {
            const cover = item.coverAttachmentId
              ? `/api/files/${item.coverAttachmentId}?view=1`
              : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  router.push(
                    itemDetailHref(
                      item.id,
                      index,
                      "list",
                    ),
                  )
                }
                className="axis-panel axis-card-interactive flex w-full overflow-hidden text-left"
              >
                <div className="axis-list-cover">
                  {cover ? (
                    <img src={cover} alt="" />
                  ) : (
                    <span className="block break-words px-2 text-center text-sm font-medium leading-snug">{item.title}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 p-4">
                  <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wider text-muted">
                    <span>{TYPE_LABEL[item.type] ?? item.type}</span>
                    <span>สิ้นสุด {shortDate(endDate(item))}</span>
                  </div>

                  <h3 className="mt-1 text-base font-medium">
                    {item.title}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                    {item.body}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="axis-bookshelf-scene">
            {filtered.map((item, index) => {
              const offset = index - activeIndex;
              const distance = Math.abs(offset);

              if (distance > 5) return null;

              const isActive = offset === 0;
              const cover = item.coverAttachmentId
                ? `/api/files/${item.coverAttachmentId}?view=1`
                : null;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectBook(index)}
                  aria-label={
                    isActive
                      ? `เปิด ${item.title}`
                      : `เลือก ${item.title}`
                  }
                  aria-current={isActive ? "true" : undefined}
                  className={[
                    "axis-book-position",
                    isActive ? "is-active" : "",
                  ].join(" ")}
                  style={positionVars(offset, isActive)}
                >
                  {isActive ? (
                    /*
                     * CURRENT ITEM
                     * Flat 2D poster/card only.
                     * No top, no spine and no isometric skew.
                     */
                    <span className="axis-active-poster">
                      {cover ? (
                        <img
                          src={cover}
                          alt={item.title}
                          className="axis-active-poster-image"
                          draggable={false}
                        />
                      ) : (
                        /*
                         * No image:
                         * keep the old cover-card idea,
                         * but make it completely flat.
                         */
                        <span className="axis-active-poster-fallback">
                          <small>
                            {TYPE_LABEL[item.type] ?? item.type}
                          </small>

                          <strong
                            className={[
                              "axis-active-poster-title",
                              bookTitleSize(item.title),
                            ].join(" ")}
                          >
                            {item.title}
                          </strong>

                          <span className="axis-active-poster-open">
                            กดเพื่อเปิดประกาศ
                          </span>
                        </span>
                      )}
                    </span>
                  ) : (
                    /*
                     * OTHER BOOKS
                     * Keep the exact +30° / -30° / 90°
                     * isometric geometry.
                     */
                    <span
                      className={[
                        "axis-iso-book",
                        `axis-iso-book--${item.type.toLowerCase()}`,
                      ].join(" ")}
                    >
                      <span className="axis-iso-book-front">
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            className="axis-iso-book-cover"
                            draggable={false}
                          />
                        ) : (
                          <span className="axis-iso-book-fallback">
                            <small>
                              {TYPE_LABEL[item.type] ?? item.type}
                            </small>
                            <strong>{item.title}</strong>
                          </span>
                        )}
                      </span>

                      <span className="axis-iso-book-side">
                        <span
                          className={[
                            "axis-iso-book-side-text",
                            bookTitleSize(item.title),
                          ].join(" ")}
                        >
                          {item.title}
                        </span>
                      </span>

                      <span className="axis-iso-book-top">
                        <span>{shortDate(endDate(item))}</span>
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {active && (
            <section className="axis-selected-card">
              <div className="axis-selected-head flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                    {TYPE_LABEL[active.type] ?? active.type}
                  </p>

                  <h2 className="mt-1 text-xl sm:text-2xl">
                    {active.title}
                  </h2>
                </div>

                {signedIn && <SaveButton
                  itemId={active.id}
                  initialSaved={active.saved}
                />}
              </div>

              <p className="axis-selected-body mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
                {truncate(active.body, 220)}
              </p>

              <div className="axis-selected-meta mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-soft p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted">
                    วันสิ้นสุด
                  </p>
                  <p className="mt-1 text-sm">
                    {shortDate(endDate(active))}
                  </p>
                </div>

                {active.eventStart && (
                  <div className="rounded-xl bg-soft p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      เริ่มกิจกรรม
                    </p>
                    <p className="mt-1 text-sm">
                      {fullDate(active.eventStart)}
                    </p>
                  </div>
                )}

                {active.location && (
                  <div className="rounded-xl bg-soft p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      สถานที่
                    </p>
                    <p className="mt-1 text-sm">
                      {active.location}
                    </p>
                  </div>
                )}

                {active.targetYear && (
                  <div className="rounded-xl bg-soft p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted">
                      ชั้นปีเป้าหมาย
                    </p>
                    <p className="mt-1 text-sm">
                      ปี {active.targetYear}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    itemDetailHref(
                      active.id,
                      activeIndex,
                      "shelf",
                    ),
                  )
                }
                className="axis-selected-open mt-4 text-sm font-medium text-brand hover:underline"
              >
                เปิดประกาศฉบับเต็ม →
              </button>
            </section>
          )}

          <div className="axis-shelf-position">
            <span>
              {activeIndex + 1} / {filtered.length}
            </span>

            <div className="axis-shelf-dots">
              {filtered.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`ประกาศ ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  className={index === activeIndex ? "is-active" : ""}
                />
              ))}
            </div>
          </div>

          <div className="axis-shelf-navigation">
            <button
              type="button"
              onClick={previous}
              disabled={activeIndex === 0}
            >
              ← ก่อนหน้า
            </button>

            <button
              type="button"
              onClick={next}
              disabled={activeIndex === filtered.length - 1}
            >
              ถัดไป →
            </button>
          </div>
        </>
      )}
    </section>
  );
}
