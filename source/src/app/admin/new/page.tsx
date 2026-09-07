import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createItem } from "@/app/actions/content";
import ItemForm from "@/components/ItemForm";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  // SRS-13 ผู้อ่านเปิดหน้านี้ไม่ได้
  if (session.user.role === "READER") redirect("/");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-lg">สร้างประกาศ</h1>
      <ItemForm action={createItem} mode="create" />
    </div>
  );
}
