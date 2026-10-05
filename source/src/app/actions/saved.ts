"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function saveItem(itemId: string) {
  const user = await requireUser();

  await db.savedItem.upsert({
    where: { userId_itemId: { userId: user.id, itemId } },
    create: { userId: user.id, itemId },
    update: {},
  });

  revalidatePath("/saved");
  revalidatePath("/announcements");
  revalidatePath(`/items/${itemId}`);
}

export async function unsaveItem(itemId: string) {
  const user = await requireUser();

  await db.savedItem.deleteMany({ where: { userId: user.id, itemId } });

  revalidatePath("/saved");
  revalidatePath("/announcements");
  revalidatePath(`/items/${itemId}`);
}
