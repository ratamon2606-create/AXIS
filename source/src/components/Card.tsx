import Link from "next/link";
import type { ContentItem } from "@prisma/client";
import { TYPE_LABEL, TYPE_FIELDS } from "@/lib/items";

const TONE: Record<string, string> = {
  NEWS: "bg-[#E4F0F8] text-[#2C7BB6]",
  OPPORTUNITY: "bg-[#EDE8FB] text-[#6B4FBB]",
  ACTIVITY: "bg-brandsoft text-branddeep",
  ALERT: "bg-dangersoft text-danger",
  DOCUMENT: "bg-[#DFF2F1] text-[#0E7C7B]",
};

export function Card({ item }: { item: ContentItem }) {
  const details = (item.details ?? {}) as Record<string, string>;
  const facts = (TYPE_FIELDS[item.type] ?? [])
    .map((f) => details[f.key])
    .filter(Boolean)
    .slice(0, 2);

  return (
    <Link
      href={`/items/${item.id}`}
      className="block rounded-2xl bg-paper p-3 shadow-sm ring-1 ring-line/60"
    >
      <div className="flex flex-wrap gap-1.5">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TONE[item.type]}`}>
          {TYPE_LABEL[item.type]}
        </span>
        <span className="rounded bg-brandsoft px-1.5 py-0.5 text-[10px] font-medium text-branddeep">
          {item.department}
        </span>
        {item.visibility === "KU_ONLY" && (
          <span className="rounded bg-wash px-1.5 py-0.5 text-[10px] text-muted">🔒 เฉพาะ KU</span>
        )}
      </div>
      <h3 className="mt-1.5 text-sm font-medium leading-snug">{item.title}</h3>
      {facts.length > 0 && (
        <p className="mt-1.5 text-xs text-muted">{facts.join(" · ")}</p>
      )}
    </Link>
  );
}
