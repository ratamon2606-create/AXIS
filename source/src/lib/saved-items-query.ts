import type { Prisma } from "@prisma/client";
import { visibleWhere } from "@/lib/items";

/** Never render hidden/draft posts in saved previews, including the homepage. */
export function savedItemsWhere(userId: string): Prisma.SavedItemWhereInput {
  return { userId, item: visibleWhere(true, "all") };
}
