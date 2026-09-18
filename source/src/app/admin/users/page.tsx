import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { changeRole, addToAllowlist } from "@/app/actions/roles";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  READER: "ผู้อ่าน",
  EDITOR: "ผู้เขียน",
  ADMIN: "ผู้ดูแล",
};

/**
 * หน้าจัดการสิทธิ์ · เจ้าของไฟล์คือ Piyatida (US-8)
 *
 * แสดงสองกลุ่ม คือบัญชีที่เคยเข้าสู่ระบบแล้ว และอีเมลที่ใส่ไว้ล่วงหน้า
 * แยกให้เห็นชัดเพราะสองกลุ่มนี้ต่างกัน กลุ่มหลังยังไม่มีบัญชีจริงในระบบ
 */
export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role !== "ADMIN") redirect("/admin");

  const [users, invites] = await Promise.all([
    db.user.findMany({ orderBy: [{ role: "asc" }, { email: "asc" }] }),
    db.allowlist.findMany({ orderBy: { email: "asc" } }),
  ]);

  const invitedNotJoined = invites.filter(
    (i) => !users.some((u) => u.email === i.email)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-lg">ผู้ใช้และสิทธิ์</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted">
          บัญชีที่เคยเข้าสู่ระบบ · {users.length} บัญชี
        </h2>

        <ul className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line/60">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-3 border-b border-line px-3 py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.name ?? "ไม่ระบุชื่อ"}</p>
                <p className="truncate text-xs text-muted">{u.email}</p>
              </div>

              <span className="text-xs text-faint">
                {u.department ?? "-"} {u.year ? `ปี ${u.year}` : ""}
              </span>

              <form action={changeRole} className="flex items-center gap-2">
                <input type="hidden" name="userId" value={u.id} />
                <select
                  name="role"
                  defaultValue={u.role}
                  className="rounded-lg border border-line bg-paper px-2 py-1 text-xs"
                >
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button className="rounded-lg bg-brand px-3 py-1 text-xs text-white">
                  บันทึก
                </button>
              </form>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted">
          สิทธิ์ใหม่มีผลตั้งแต่คำขอถัดไปของบัญชีนั้น ไม่ต้องให้เขาออกจากระบบก่อน
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted">
          อีเมลที่ใส่ไว้ล่วงหน้า · ยังไม่เคยเข้าสู่ระบบ {invitedNotJoined.length} รายการ
        </h2>

        {invitedNotJoined.length > 0 && (
          <ul className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line/60">
            {invitedNotJoined.map((i) => (
              <li
                key={i.email}
                className="flex items-center gap-3 border-b border-line px-3 py-2.5 text-sm last:border-0"
              >
                <span className="min-w-0 flex-1 truncate">{i.email}</span>
                <span className="text-xs text-muted">{ROLE_LABEL[i.role]}</span>
                {i.note && <span className="text-xs text-faint">{i.note}</span>}
              </li>
            ))}
          </ul>
        )}

        <form action={addToAllowlist} className="rounded-2xl bg-paper p-3 ring-1 ring-line/60">
          <p className="mb-2 text-sm font-medium">เพิ่มอีเมลล่วงหน้า</p>
          <div className="flex flex-wrap gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder="name@ku.th"
              className="min-w-48 flex-1 rounded-xl border border-line px-3 py-2 text-sm"
            />
            <select
              name="role"
              defaultValue="EDITOR"
              className="rounded-xl border border-line px-3 py-2 text-sm"
            >
              {Object.entries(ROLE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              name="note"
              placeholder="หมายเหตุ"
              className="min-w-32 flex-1 rounded-xl border border-line px-3 py-2 text-sm"
            />
            <button className="rounded-xl bg-brand px-4 py-2 text-sm text-white">เพิ่ม</button>
          </div>
          <p className="mt-2 text-xs text-muted">
            ถ้าอีเมลนี้เคยเข้าสู่ระบบแล้ว สิทธิ์จะถูกปรับให้ทันทีด้วย
          </p>
        </form>
      </section>
    </div>
  );
}
