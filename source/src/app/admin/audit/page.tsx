import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { recentAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  CREATE: "สร้าง",
  UPDATE: "แก้ไข",
  PUBLISH: "เผยแพร่",
  MARK_PAST: "ให้จบ",
  EXTEND: "ต่ออายุ",
  HIDE: "ซ่อนถาวร",
  ROLE_CHANGE: "เปลี่ยนสิทธิ์",
  ATTACH: "แนบไฟล์",
};

/**
 * หน้าดูบันทึกการใช้งาน · เจ้าของไฟล์คือ Piyatida (US-8)
 *
 * SRS-21 และ NFR-8
 * หน้านี้อ่านอย่างเดียวโดยตั้งใจ ไม่มีปุ่มลบและไม่มีปุ่มแก้
 * บันทึกที่แก้ได้ไม่มีประโยชน์ในการตรวจสอบ
 */
export default async function AuditPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role !== "ADMIN") redirect("/admin");

  const rows = await recentAudit(100);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-lg">บันทึกการใช้งาน</h1>
        <p className="mt-1 text-sm text-muted">
          ทุกการเขียนถูกบันทึกพร้อมผู้กระทำและเวลา แก้ไขหรือลบจากหน้าเว็บไม่ได้
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          ยังไม่มีบันทึก
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line/60">
          {rows.map((r) => (
            <li key={r.id} className="border-b border-line px-3 py-2.5 last:border-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="rounded bg-brandsoft px-1.5 py-0.5 text-[10px] font-medium text-branddeep">
                  {ACTION_LABEL[r.action] ?? r.action}
                </span>
                <span className="text-sm">{r.actor.name ?? r.actor.email}</span>
                <span className="ml-auto text-xs text-faint">
                  {new Intl.DateTimeFormat("th-TH", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(r.createdAt)}
                </span>
              </div>
              {r.item && <p className="mt-1 text-xs text-muted">{r.item.title}</p>}
              {r.detail && <p className="mt-0.5 text-xs text-faint">{r.detail}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
