import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { saveProfile } from "@/app/actions/profile";
import { currentAcademicYearBE } from "@/lib/studentId";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.department) redirect("/");

  const nowBE = currentAcademicYearBE();

  return (
    <form action={saveProfile} className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-lg">ตั้งค่าครั้งแรก</h1>
        <p className="mt-1 text-sm leading-6 text-muted">
          กรอกรหัสนิสิต ระบบจะแยกภาควิชาและชั้นปีให้เอง
          ข้อมูลนี้ใช้จัดลำดับประกาศให้ตรงกับคุณเท่านั้น
        </p>
      </div>

      {err && <p className="rounded-xl bg-dangersoft px-3 py-2.5 text-sm text-danger">{err}</p>}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">รหัสนิสิต</span>
        <input
          name="studentId"
          inputMode="numeric"
          maxLength={10}
          placeholder="6810545883"
          required
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-base tracking-widest outline-none focus:border-brand"
        />
      </label>

      <div className="rounded-xl bg-paper p-3 text-xs leading-6 text-muted ring-1 ring-line/60">
        <p className="mb-1 font-medium text-ink">ระบบอ่านรหัสอย่างไร</p>
        <p>
          สองหลักแรกคือปีการศึกษาที่เข้า เทียบกับปีปัจจุบัน {nowBE} เพื่อหาชั้นปี
          <br />
          หลักที่หกและเจ็ดคือรหัสภาควิชา 45 คือ SKE และ 40 คือ CPE
          <br />
          ตัวอย่าง 6810545883 คือ SKE ชั้นปีที่ {nowBE - 2568 + 1}
        </p>
      </div>

      <button className="w-full rounded-xl bg-brand py-2.5 text-sm text-white">เริ่มใช้งาน</button>
    </form>
  );
}
