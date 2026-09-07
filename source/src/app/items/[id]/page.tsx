import { notFound } from "next/navigation";
import type { Department } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { visibleItemWhere, TYPE_LABEL } from "@/lib/items";

const DEPARTMENT_LABEL: Record<Department, string> = {
  CPE: "CPE",
  SKE: "SKE",
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * หน้ารายละเอียด/เธรด: ตรวจ visibility ซ้ำฝั่ง server เสมอ (ห้ามเชื่อ query จากฟีด)
 * ใช้ visibleItemWhere เดียวกันทั้งโพสต์แม่และโพสต์ต่อ เพื่อไม่ให้ policy เพี้ยนไปคนละที่
 */
export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const signedIn = Boolean(session?.user?.id);

  const item = await db.contentItem.findFirst({
    where: { id, ...visibleItemWhere(signedIn) },
    include: {
      author: { select: { name: true } },
      children: {
        where: visibleItemWhere(signedIn),
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!item) notFound();

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 rounded-2xl border border-line bg-paper p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
          <span className="rounded-full bg-wash px-2 py-0.5">{TYPE_LABEL[item.type]}</span>
          <span className="rounded-full bg-wash px-2 py-0.5">
            {DEPARTMENT_LABEL[item.department]}
          </span>
          {item.visibility === "KU_ONLY" && (
            <span className="rounded-full bg-brandsoft px-2 py-0.5 text-branddeep">
              เฉพาะ KU
            </span>
          )}
        </div>
        <h1 className="font-display text-xl text-ink">{item.title}</h1>
        <div className="flex items-center gap-2 text-xs text-faint">
          {item.author?.name && <span>{item.author.name}</span>}
          <time dateTime={item.createdAt.toISOString()}>{formatDateTime(item.createdAt)}</time>
        </div>
        <p className="whitespace-pre-wrap text-sm text-ink">{item.body}</p>
      </header>

      {item.children.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-faint">การตอบกลับ</h2>
          {item.children.map((reply) => (
            <div key={reply.id} className="rounded-2xl border border-line bg-paper p-4">
              <div className="flex items-center gap-2 text-xs text-faint">
                {reply.author?.name && <span>{reply.author.name}</span>}
                <time dateTime={reply.createdAt.toISOString()}>
                  {formatDateTime(reply.createdAt)}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm text-ink">{reply.body}</p>
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
