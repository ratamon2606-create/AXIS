import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { verifyTwoFactorLogin } from "@/app/actions/twoFactor";

export const dynamic = "force-dynamic";

export default async function Verify2FAPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/");
  if (!session.user.twoFactorEnabled) redirect("/setup-2fa");
  if (session.twoFactorVerified) redirect("/");

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-lg">ยืนยันตัวตนสองชั้น</h1>
        <p className="mt-1 text-sm leading-6 text-muted">
          เปิดแอป Authenticator บนมือถือแล้วกรอกรหัส 6 หลักที่แสดงอยู่ตอนนี้
        </p>
      </div>

      {err && <p className="rounded-xl bg-dangersoft px-3 py-2.5 text-sm text-danger">{err}</p>}

      <form action={verifyTwoFactorLogin} className="space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">รหัส 6 หลักจากแอป</span>
          <input
            type="text"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-center text-lg tracking-[0.5em]"
            placeholder="••••••"
          />
        </label>
        <button className="w-full rounded-xl bg-brand py-2.5 text-sm text-white">ยืนยัน</button>
      </form>
    </div>
  );
}
