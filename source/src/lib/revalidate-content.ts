import { revalidatePath } from "next/cache";

const LIST_PATHS = ["/", "/announcements", "/search", "/calendar", "/past", "/saved"] as const;

export function revalidateContent(itemId?: string): void {
  for (const path of LIST_PATHS) revalidatePath(path);
  if (itemId) revalidatePath(`/items/${itemId}`);
}
