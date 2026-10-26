import { redirect } from "next/navigation";
import {
  auth,
  signOut,
} from "@/lib/auth";
import {
  updateProfile,
} from "@/app/actions/profile";

export const dynamic =
  "force-dynamic";

const ROLE: Record<
  string,
  string
> = {
  READER: "ผู้อ่าน",
  EDITOR: "ผู้เขียน",
  ADMIN: "ผู้ดูแล",
};

const PROGRAMS = [
  {
    value: "SKE",
    label: "SKE",
    full:
      "วิศวกรรมซอฟต์แวร์และความรู้",
  },
  {
    value: "CPE",
    label: "CPE",
    full:
      "วิศวกรรมคอมพิวเตอร์",
  },
] as const;

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{
    err?: string;
    updated?: string;
  }>;
}) {
  const {
    err,
    updated,
  } = await searchParams;

  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const rows = [
    [
      "บัญชี",
      session.user.email,
    ],
    [
      "หลักสูตรและชั้นปี",
      `${
        session.user.program ?? "-"
      } ปี ${
        session.user.year ?? "-"
      }`,
    ],
    [
      "สิทธิ์",
      ROLE[
        session.user.role
      ] ?? session.user.role,
    ],
  ];

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-medium">
          โปรไฟล์
        </h1>

        <p className="mt-1 text-sm text-muted">
          จัดการข้อมูลที่ใช้ปรับประกาศให้ตรงกับคุณ
        </p>
      </div>

      {updated && (
        <p
          role="status"
          className="rounded-xl bg-successsoft px-3 py-2.5 text-sm text-success"
        >
          บันทึกหลักสูตรและชั้นปีเรียบร้อยแล้ว
        </p>
      )}

      {err && (
        <p
          role="alert"
          className="rounded-xl bg-dangersoft px-3 py-2.5 text-sm text-danger"
        >
          {err}
        </p>
      )}

      <dl className="overflow-hidden rounded-2xl bg-paper ring-1 ring-line/60">
        {rows.map(
          ([key, value]) => (
            <div
              key={key}
              className="flex gap-3 border-b border-line px-4 py-3 last:border-0"
            >
              <dt className="w-36 shrink-0 text-sm text-faint">
                {key}
              </dt>

              <dd className="text-base font-medium">
                {value}
              </dd>
            </div>
          ),
        )}
      </dl>

      {/* =====================================================
          EDIT PROGRAM / YEAR
          ===================================================== */}

      <details className="group overflow-hidden rounded-2xl bg-paper ring-1 ring-line/60">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium transition hover:bg-soft">
          <span>
            แก้ไขหลักสูตรและชั้นปี
          </span>

          <span
            aria-hidden="true"
            className="text-lg text-muted transition group-open:rotate-180"
          >
            ⌄
          </span>
        </summary>

        <form
          action={updateProfile}
          className="space-y-4 border-t border-line px-4 py-4"
        >
          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              หลักสูตร
            </legend>

            <div className="grid gap-2 sm:grid-cols-2">
              {PROGRAMS.map(
                (program) => (
                  <label
                    key={
                      program.value
                    }
                    className="flex cursor-pointer gap-3 rounded-xl bg-white p-3 text-sm ring-1 ring-line/70 transition has-[:checked]:ring-2 has-[:checked]:ring-brand"
                  >
                    <input
                      type="radio"
                      name="program"
                      value={
                        program.value
                      }
                      required
                      defaultChecked={
                        session.user
                          .program ===
                        program.value
                      }
                      className="mt-0.5 accent-brand"
                    />

                    <span>
                      <span className="font-medium">
                        {program.label}
                      </span>

                      <span className="mt-0.5 block text-xs leading-5 text-muted">
                        {program.full}
                      </span>
                    </span>
                  </label>
                ),
              )}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              ชั้นปี
            </span>

            <select
              name="year"
              required
              defaultValue={String(
                session.user.year ??
                  1,
              )}
              className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base"
            >
              {[
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
              ].map((year) => (
                <option
                  key={year}
                  value={year}
                >
                  ปี {year}
                </option>
              ))}
            </select>
          </label>

          <p className="rounded-xl bg-soft px-3 py-2.5 text-xs leading-5 text-muted">
            หลักสูตรและชั้นปีใช้สำหรับจัดลำดับและแนะนำประกาศให้เหมาะกับคุณ
            การเปลี่ยนข้อมูลนี้ไม่เปลี่ยนสิทธิ์ของบัญชี
          </p>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-95"
          >
            บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </details>

      {/* =====================================================
          ROLE EXPLANATION
          ===================================================== */}

      <p className="rounded-xl bg-paper px-4 py-3 text-sm leading-6 text-muted ring-1 ring-line/60">
        สิทธิ์ของบัญชี เช่น ผู้อ่าน ผู้เขียน หรือผู้ดูแล
        ถูกกำหนดโดยผู้ดูแลระบบและเปลี่ยนผ่านหน้า
        “ผู้ใช้และสิทธิ์”
        ส่วนหลักสูตรและชั้นปีสามารถแก้ไขได้จากโปรไฟล์นี้
      </p>

      {/* =====================================================
          SIGN OUT
          ===================================================== */}

      <form
        action={async () => {
          "use server";

          await signOut({
            redirectTo: "/",
          });
        }}
      >
        <button className="w-full rounded-xl border border-line py-2.5 text-sm">
          ออกจากระบบ
        </button>
      </form>
    </div>
  );
}
