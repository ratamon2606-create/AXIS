"use client";

import { endDate, shortDate, type ShelfItem } from "@/lib/bookshelf-utils";

export function BookshelfList({
  items, typeLabels, onOpen,
}: {
  items: ShelfItem[];
  typeLabels: Record<string, string>;
  onOpen: (item: ShelfItem, index: number) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const cover = item.coverAttachmentId
          ? `/api/files/${item.coverAttachmentId}?view=1`
          : null;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item, index)}
            className="axis-panel axis-card-interactive flex w-full overflow-hidden text-left"
          >
            <div className="axis-list-cover">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" />
              ) : (
                <span className="block break-words px-2 text-center text-sm font-medium leading-snug">{item.title}</span>
              )}
            </div>
            <div className="min-w-0 flex-1 p-4">
              <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wider text-muted">
                <span>{typeLabels[item.type] ?? item.type}</span>
                <span>สิ้นสุด {shortDate(endDate(item))}</span>
              </div>
              <h3 className="mt-1 text-base font-medium">{item.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{item.body}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
