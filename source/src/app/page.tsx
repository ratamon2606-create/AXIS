import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth, signIn } from "@/lib/auth";
import { visibleWhere, TYPE_LABEL } from "@/lib/items";
import { Card } from "@/components/Card";
import type { ItemType } from "@prisma/client";

export const dynamic = "force-dynamic";

const TAGS: (ItemType | "ALL")[] = ["ALL", "NEWS", "OPPORTUNITY", "ACTIVITY", "ALERT", "DOCUMENT"];

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const session = await auth();
  const signedIn = !!session?.user;

  // ล็อกอินแล้วแต่ยังไม่ได้ตั้งค่าภาคและชั้นปี
  if (session?.user && !session.user.department) redirect("/onboarding");

  const where = visibleWhere(signedIn);
  const items = await db.contentItem.findMany({
    where: tag && tag !== "ALL" ? { ...where, type: tag as ItemType } : where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const hiddenCount = signedIn
    ? 0
    : await db.contentItem.count({
        where: { status: "PUBLISHED", parentId: null, visibility: "KU_ONLY" },
      });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {TAGS.map((t) => {
          const on = (tag ?? "ALL") === t;
          return (
            <Link
              key={t}
              href={t === "ALL" ? "/" : `/?tag=${t}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                on
                  ? "border-brand bg-brandsoft font-medium text-branddeep"
                  : "border-line bg-paper text-muted"
              }`}
            >
              {t === "ALL" ? "รวมทั้งหมด" : TYPE_LABEL[t]}
            </Link>
          );
        })}
      </div>

      {!signedIn && (
        <div className="rounded-2xl bg-gradient-to-br from-brand to-branddeep p-4 text-white">
          <p className="font-display text-base">ข่าวสารภาควิชา ที่เดียวจบ</p>
          <p className="mt-1 text-xs opacity-90">ประกาศ เอกสาร และกิจกรรมของ CPE และ SKE</p>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button className="mt-3 w-full rounded-xl bg-paper py-2 text-sm text-branddeep">
              เข้าสู่ระบบด้วยบัญชี @ku.th
            </button>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          ไม่มีประกาศในแท็กนี้
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>
      )}

      {!signedIn && hiddenCount > 0 && (
        <p className="rounded-2xl bg-brandsoft p-4 text-center text-sm text-branddeep">
          🔒 อีก {hiddenCount} ประกาศสำหรับนิสิต เข้าสู่ระบบเพื่อดู
        </p>
      )}
    </div>
  );
}
