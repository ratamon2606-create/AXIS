import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createItem } from "@/app/actions/content";
import ItemForm from "@/components/ItemForm";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const session = await auth();
  if (!session?.user || session.user.role === "READER") redirect("/");
  return <div className="mx-auto max-w-5xl space-y-5"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">ผู้เขียน</p><h1 className="mt-1 text-2xl sm:text-3xl">สร้างประกาศ</h1><p className="mt-1 text-sm text-muted">ฟอร์มจะขยายตามหน้าจอ และจัดกลุ่มช่องกรอกตามหน้าที่เพื่อลดการกรอกผิด</p></div><ItemForm action={createItem} mode="create" /></div>;
}