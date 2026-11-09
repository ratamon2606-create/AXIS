import { AUDIENCES } from "@/lib/content-validation";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_TOTAL_BYTES = 80 * 1024 * 1024;

export function validateItemForm(formData: FormData): Record<string, string> {
  const errors: Record<string, string> = {};
  const files = formData.getAll("attachments").filter(
    (value): value is File => value instanceof File && value.size > 0,
  );

  const oversized = files.find((file) => file.size > MAX_FILE_BYTES);
  if (oversized) errors.attachments = `${oversized.name} ใหญ่เกิน 20 MB`;
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    errors.attachments = "ไฟล์แนบรวมกันต้องไม่เกิน 80 MB ต่อการบันทึกหนึ่งครั้ง";
  }

  if (!String(formData.get("title") ?? "").trim()) {
    errors.title = "ต้องมีหัวข้อก่อนบันทึก";
  }
  if (!String(formData.get("body") ?? "").trim()) {
    errors.body = "ต้องมีเนื้อหาก่อนบันทึก";
  }
  if (!AUDIENCES.includes(String(formData.get("audience") ?? "") as (typeof AUDIENCES)[number])) {
    errors.audience = "ต้องเลือกกลุ่มเป้าหมาย";
  }

  const dateMode = String(formData.get("dateMode") ?? "none");
  if ((dateMode === "deadline" || dateMode === "both") && !formData.get("deadlineAt")) {
    errors.deadlineAt = "กรุณาระบุวันกำหนดส่ง";
  }
  if ((dateMode === "period" || dateMode === "both") && !formData.get("eventStart")) {
    errors.eventStart = "กรุณาระบุวันเริ่มเหตุการณ์";
  }
  if (formData.get("archivePolicy") === "CUSTOM" && !formData.get("expiresAt")) {
    errors.expiresAt = "กรุณาระบุวันเก็บเข้าคลัง";
  }

  const start = String(formData.get("eventStart") ?? "");
  const end = String(formData.get("eventEnd") ?? "");
  if (start && end && end < start) errors.eventEnd = "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม";

  return errors;
}
