import Link from "next/link";
import type { ContentItem } from "@prisma/client";
import { AUDIENCE_LABEL, TYPE_LABEL } from "@/lib/items";

const TONE: Record<string, string> = {
  NEWS: "bg-[#E4F0F8] text-[#2C7BB6]",
  OPPORTUNITY: "bg-[#EDE8FB] text-[#6B4FBB]",
  ACTIVITY: "bg-brandsoft text-branddeep",
  ALERT: "bg-dangersoft text-danger",
  DOCUMENT: "bg-[#DFF2F1] text-[#0E7C7B]",
};

export function Card({ item }: { item: ContentItem }) {
  return (
    <Link href={`/items/${item.id}`} className="axis-card-interactive flex h-full min-w-0 flex-col rounded-2xl border border-line/80 bg-paper p-4 shadow-sm">
      <div className="flex flex-wrap gap-1.5">
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${TONE[item.type]}`}>{TYPE_LABEL[item.type]}</span>
        <span className="rounded-md bg-wash px-1.5 py-0.5 text-[10px] text-muted">{AUDIENCE_LABEL[item.audience]}</span>
        {item.targetYear && <span className="rounded-md bg-wash px-1.5 py-0.5 text-[10px] text-muted">ปี {item.targetYear}</span>}
        {item.visibility === "KU_ONLY" && <span className="rounded-md bg-wash px-1.5 py-0.5 text-[10px] text-muted">🔒 KU</span>}
      </div>
      <h3 className="mt-2 text-sm font-medium leading-snug sm:text-[15px]">{item.title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-xs leading-5 text-muted">{item.body}</p>
      <span className="mt-3 text-xs font-medium text-branddeep">เปิดรายละเอียด →</span>
    </Link>
  );
}
