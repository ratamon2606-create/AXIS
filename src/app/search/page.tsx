import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { visibleWhere, TYPE_LABEL } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await auth();
  const signedIn = !!session?.user;

  const results = q
    ? await db.contentItem.findMany({
        where: {
          ...visibleWhere(signedIn),
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { body: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <form action="/search" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="ค้นหาประกาศ"
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white">
          ค้นหา
        </button>
      </form>

      {!q && (
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          พิมพ์คำที่ต้องการค้นหา เช่น ห้อง หรือ ทุน
        </p>
      )}

      {q && results.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          <p>ไม่พบรายการที่ตรงกับ “{q}”</p>
          <Link href="/search" className="mt-3 inline-block text-emerald-700 underline">
            ล้างการค้นหา
          </Link>
        </div>
      )}

      {q && results.length > 0 && (
        <>
          <p className="text-sm text-neutral-500">พบ {results.length} รายการ</p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((item) => (
              <li key={item.id} className="rounded-lg border border-neutral-200 bg-white p-3">
                <Link href={`/items/${item.id}`}>
                  <span className="text-xs text-neutral-500">
                    {TYPE_LABEL[item.type]} · {item.department}
                    {item.visibility === "KU_ONLY" && " · เฉพาะ KU"}
                  </span>
                  <h3 className="mt-1 text-sm font-medium">{item.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
