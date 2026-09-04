import Link from "next/link";
import type { ContentItem, Department, User } from "@prisma/client";
import { TYPE_LABEL } from "@/lib/items";

const DEPARTMENT_LABEL: Record<Department, string> = {
  CPE: "CPE",
  SKE: "SKE",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

type CardItem = Pick<
  ContentItem,
  "id" | "title" | "type" | "department" | "visibility" | "createdAt"
> & {
  author: Pick<User, "name"> | null;
};

/** การ์ดสรุปในฟีด กดแล้วไปหน้ารายละเอียด/เธรด เป็น server component เพราะไม่มี interaction ฝั่ง client */
export default function Card({ item }: { item: CardItem }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4 transition hover:border-brand"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
        <span className="rounded-full bg-wash px-2 py-0.5">{TYPE_LABEL[item.type]}</span>
        <span className="rounded-full bg-wash px-2 py-0.5">
          {DEPARTMENT_LABEL[item.department]}
        </span>
        {item.visibility === "KU_ONLY" && (
          <span className="rounded-full bg-brandsoft px-2 py-0.5 text-branddeep">เฉพาะ KU</span>
        )}
      </div>
      <h2 className="font-display text-base text-ink">{item.title}</h2>
      <div className="flex items-center gap-2 text-xs text-faint">
        {item.author?.name && <span>{item.author.name}</span>}
        <time dateTime={item.createdAt.toISOString()}>{formatDate(item.createdAt)}</time>
      </div>
    </Link>
  );
}
