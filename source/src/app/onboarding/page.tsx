import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { saveProfile } from "@/app/actions/profile";

export const dynamic = "force-dynamic";

const DEPTS = [
  { value: "SKE", label: "SKE", full: "วิศวกรรมซอฟต์แวร์และความรู้" },
  { value: "CPE", label: "CPE", full: "วิศวกรรมคอมพิวเตอร์" },
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.department) redirect("/");

  return (
    <form action={saveProfile} className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-lg">ตั้งค่าครั้งแรก</h1>
        <p className="mt-1 text-sm leading-6 text-muted">
          บอกเราหน่อยว่าคุณอยู่ภาควิชาไหน ชั้นปีอะไร
          ข้อมูลนี้ใช้จัดลำดับประกาศให้ตรงกับคุณเท่านั้น และแก้ไขภายหลังได้
        </p>
      </div>

      {err && <p className="rounded-xl bg-dangersoft px-3 py-2.5 text-sm text-danger">{err}</p>}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">ภาควิชา</legend>
        {DEPTS.map((d, i) => (
          <label
            key={d.value}
            className="mb-2 flex cursor-pointer gap-3 rounded-xl bg-paper p-3 text-sm ring-1 ring-line/60 has-[:checked]:ring-2 has-[:checked]:ring-brand"
          >
            <input
              type="radio"
              name="department"
              value={d.value}
              required
              defaultChecked={i === 0}
              className="mt-0.5 accent-brand"
            />
            <span>
              {d.label}
              <span className="mt-0.5 block text-xs text-muted">{d.full}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">ชั้นปี</span>
        <select
          name="year"
          required
          defaultValue="1"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => (
            <option key={y} value={y}>
              ปี {y}
            </option>
          ))}
        </select>
      </label>

      <button className="w-full rounded-xl bg-brand py-2.5 text-sm text-white">เริ่มใช้งาน</button>
    </form>
  );
}
