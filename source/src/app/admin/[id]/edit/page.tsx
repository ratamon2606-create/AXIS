import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canEditItem } from "@/lib/items";
import { updateItem } from "@/app/actions/content";
import ItemForm from "@/components/ItemForm";

export const dynamic = "force-dynamic";

function localDateTime(value: Date | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value).replace(" ", "T");
}

function localDate(value: Date | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role === "READER") redirect("/");

  const item = await db.contentItem.findUnique({ where: { id }, include: { attachments: true } });
  if (!item || !canEditItem(session.user, item)) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-lg">แก้ไขประกาศ</h1>
      <p className="rounded-xl bg-paper px-3 py-2.5 text-xs text-muted ring-1 ring-line/60">กำลังแก้ไข · {item.title}</p>
      <ItemForm
        action={updateItem}
        mode="edit"
        values={{
          id: item.id,
          title: item.title,
          body: item.body,
          type: item.type,
          audience: item.audience,
          targetYear: item.targetYear,
          visibility: item.visibility,
          status: item.status,
          eventStart: localDateTime(item.eventStart),
          eventEnd: localDateTime(item.eventEnd),
          expiresAt: localDate(item.expiresAt),
          location: item.location ?? "",
          details: (item.details ?? {}) as Record<string, string>,
          attachments: item.attachments,
        }}
      />
    </div>
  );
}
