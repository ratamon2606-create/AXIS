import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateItem } from "@/app/actions/content";
import ItemForm from "@/components/ItemForm";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role === "READER") redirect("/");

  const item = await db.contentItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-lg">แก้ไขประกาศ</h1>
      <p className="rounded-xl bg-paper px-3 py-2.5 text-xs text-muted ring-1 ring-line/60">
        กำลังแก้ไข · {item.title}
      </p>
      <ItemForm
        action={updateItem}
        mode="edit"
        values={{
          id: item.id,
          title: item.title,
          body: item.body,
          type: item.type,
          department: item.department,
          visibility: item.visibility,
          imageUrl: item.imageUrl ?? "",
          details: (item.details ?? {}) as Record<string, string>,
        }}
      />
    </div>
  );
}
