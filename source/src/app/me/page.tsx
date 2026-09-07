import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROLE: Record<string, string> = { READER: "ผู้อ่าน", EDITOR: "ผู้เขียน", ADMIN: "ผู้ดูแล" };

export default async function MePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const rows = [
    ["บัญชี", session.user.email],
    ["ภาควิชาและชั้นปี", `${session.user.department ?? "-"} ปี ${session.user.year ?? "-"}`],
    ["สิทธิ์", ROLE[session.user.role] ?? session.user.role],
  ];

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-lg">โปรไฟล์</h1>
      <dl className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line/60">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-3 border-b border-line px-3 py-2.5 last:border-0">
            <dt className="w-32 shrink-0 text-xs text-faint">{k}</dt>
            <dd className="text-sm">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="rounded-xl bg-paper px-3 py-2.5 text-xs leading-6 text-muted ring-1 ring-line/60">
        สิทธิ์ถูกกำหนดจากรายชื่อที่ผู้ดูแลใส่ไว้ล่วงหน้าตอนล็อกอินครั้งแรก
        การเปลี่ยนสิทธิ์ผ่านหน้าเว็บเลื่อนไป iteration 2
      </p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button className="w-full rounded-xl border border-line py-2.5 text-sm">
          ออกจากระบบ
        </button>
      </form>
    </div>
  );
}
