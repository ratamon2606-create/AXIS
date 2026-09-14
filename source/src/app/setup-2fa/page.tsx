import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { confirmTwoFactorSetup } from "@/app/actions/twoFactor";
import { generateTwoFactorSecret, buildTwoFactorUri } from "@/lib/twoFactor";

export const dynamic = "force-dynamic";

export default async function Setup2FAPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.twoFactorEnabled) redirect("/verify-2fa");

  let dbUser = await db.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/");

  if (!dbUser.twoFactorSecret) {
    const secret = generateTwoFactorSecret();
    dbUser = await db.user.update({
      where: { id: dbUser.id },
      data: { twoFactorSecret: secret },
    });
  }

  const otpauthUri = buildTwoFactorUri(dbUser.twoFactorSecret!, dbUser.email);
  const qrDataUrl = await QRCode.toDataURL(otpauthUri, { margin: 1, width: 220 });
  const manualKey = dbUser.twoFactorSecret!.match(/.{1,4}/g)?.join(" ") ?? dbUser.twoFactorSecret;

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div>
        <h1 className="text-lg">ตั้งค่ายืนยันตัวตนสองชั้น</h1>
        <p className="mt-1 text-sm leading-6 text-muted">
          เปิดแอป Authenticator (เช่น Google Authenticator หรือ Authy) แล้วสแกน QR ด้านล่าง
          จากนั้นกรอกรหัส 6 หลักที่แอปแสดงเพื่อยืนยัน ทุกครั้งที่เข้าสู่ระบบหลังจากนี้จะต้องกรอกรหัสนี้ด้วย
        </p>
      </div>

      {err && <p className="rounded-xl bg-dangersoft px-3 py-2.5 text-sm text-danger">{err}</p>}

      <div className="flex flex-col items-center gap-3 rounded-2xl bg-paper p-6 ring-1 ring-line/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR code สำหรับตั้งค่า 2FA" width={220} height={220} />
        <p className="text-xs text-muted">หรือกรอกรหัสด้วยตนเอง</p>
        <code className="rounded-lg bg-wash px-3 py-1.5 text-sm tracking-wider">{manualKey}</code>
      </div>

      <form action={confirmTwoFactorSetup} className="space-y-3">
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
        <button className="w-full rounded-xl bg-brand py-2.5 text-sm text-white">
          ยืนยันและเปิดใช้งาน
        </button>
      </form>
    </div>
  );
}
