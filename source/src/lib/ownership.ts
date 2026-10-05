import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { canEditItem } from "@/lib/items";

export async function requireItemOwner(itemId: string) {
  const user = await requireEditor();
  const item = await db.contentItem.findUnique({ where: { id: itemId } });

  if (!item) throw new Error("ไม่พบประกาศนี้");
  if (!canEditItem(user, item)) throw new Error("แก้ไขได้เฉพาะประกาศของตัวเอง");

  return { user, item };
}
