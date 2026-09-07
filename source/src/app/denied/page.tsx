import Link from "next/link";
import { signIn } from "@/lib/auth";

export default async function DeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const domains = process.env.ALLOWED_EMAIL_DOMAINS ?? "ku.th";

  return (
    <div className="space-y-4 rounded-2xl bg-paper p-6 text-center ring-1 ring-line/60">
      <p className="text-3xl">🎓</p>
      <h1 className="text-lg">ต้องใช้บัญชีมหาวิทยาลัย</h1>
      <p className="text-sm leading-7 text-muted">
        {reason === "domain"
          ? `ระบบรับเฉพาะบัญชีในโดเมน ${domains} เท่านั้น และยังไม่ได้สร้างเซสชันให้บัญชีที่ใช้เข้าสู่ระบบ`
          : "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ ลองใหม่อีกครั้ง"}
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button className="w-full rounded-xl bg-brand py-2.5 text-sm text-white">
          ลองใหม่ด้วยบัญชี KU
        </button>
      </form>
      <Link href="/" className="block text-sm text-brand underline underline-offset-4">
        ดูประกาศสาธารณะแทน
      </Link>
    </div>
  );
}
