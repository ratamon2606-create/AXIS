import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canEditItem } from "@/lib/items";
import { updateItem } from "@/app/actions/content";
import ItemForm from "@/components/ItemForm";
import { itemDateFormValues } from "@/lib/edit-form-dates";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role === "READER") redirect("/");

  const item = await db.contentItem.findUnique({ where: { id }, include: { attachments: true } });
  if (!item || item.status === "HIDDEN" || !!item.parentId || !canEditItem(session.user, item)) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">ผู้เขียน</p><h1 className="mt-1 text-2xl sm:text-3xl">แก้ไขประกาศ</h1></div>
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
          ...itemDateFormValues(item),
          location: item.location ?? "",
          details: (item.details ?? {}) as Record<string, string>,
          attachments: item.attachments,
        }}
      />
    </div>
  );
}
