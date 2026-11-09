/** Validation used by both follow-up creation and editing. No database access. */
export const MAX_FOLLOW_UP_IMAGES = 4;
export const FOLLOW_UP_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function readFollowUpFields(formData: FormData): { title: string; body: string } {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) throw new Error("ต้องกรอกหัวข้อและรายละเอียด");
  if (title.length > 300 || body.length > 20_000) throw new Error("เนื้อหาอัปเดตยาวเกินไป");
  return { title, body };
}

export function assertEditableFollowUp(
  item: { parentId: string | null; status: string },
  parent: { id: string; parentId: string | null; status: string } | null,
): void {
  if (!item.parentId || !parent || parent.id !== item.parentId || parent.parentId !== null) {
    throw new Error("แก้ไขได้เฉพาะอัปเดตของประกาศหลัก");
  }
  if (!["PUBLISHED", "PAST"].includes(parent.status) || !["PUBLISHED", "PAST"].includes(item.status)) {
    throw new Error("ไม่สามารถแก้อัปเดตของประกาศที่เป็นร่างหรือถูกซ่อนได้");
  }
}

export function assertFollowUpImageCount(existingCount: number, newCount: number): void {
  if (!Number.isSafeInteger(existingCount) || existingCount < 0 || !Number.isSafeInteger(newCount) || newCount < 0 || existingCount + newCount > MAX_FOLLOW_UP_IMAGES) {
    throw new Error(`อัปเดตหนึ่งรายการมีรูปได้สูงสุด ${MAX_FOLLOW_UP_IMAGES} รูป กรุณาลบรูปเดิมก่อนเพิ่มใหม่`);
  }
}
