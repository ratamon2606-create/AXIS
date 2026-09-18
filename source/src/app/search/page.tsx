import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { visibleWhere, TYPE_LABEL, isPast } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await auth();
  const signedIn = !!session?.user;
  const query = q?.trim() ?? "";

  const results = query
    ? await db.contentItem.findMany({
        where: {
          // ใช้ AND เพื่อไม่ให้ OR ของ keyword ไปทับ OR ภายใน visibleWhere("all")
          AND: [
            visibleWhere(signedIn, "all"),
            {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { body: { contains: query, mode: "insensitive" } },
              ],
            },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-lg">ค้นหา</h1>
        <p className="mt-1 text-xs text-muted">
          ค้นทั้งประกาศปัจจุบันและประกาศที่จบแล้วจากหัวข้อหรือเนื้อหา
        </p>
      </div>

      <form action="/search" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="ค้นหาประกาศ เช่น ห้อง หรือ ทุน"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/30"
        />
        <button className="rounded-xl bg-brand px-4 py-2.5 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30">
          ค้นหา
        </button>
      </form>

      {!query && (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          พิมพ์คำที่ต้องการค้นหา เช่น ห้อง หรือ ทุน
        </p>
      )}

      {query && results.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
          <p>ไม่พบรายการที่ตรงกับ “{query}”</p>
          <Link href="/search" className="mt-3 inline-block font-medium text-branddeep underline">
            ล้างการค้นหา
          </Link>
        </div>
      )}

      {query && results.length > 0 && (
        <>
          <p className="text-sm text-muted">พบ {results.length} รายการ</p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((item) => {
              const past = isPast(item);
              return (
                <li key={item.id}>
                  <Link
                    href={`/items/${item.id}`}
                    className="block rounded-2xl bg-paper p-3 shadow-sm ring-1 ring-line/60"
                  >
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-muted">
                      <span>{TYPE_LABEL[item.type]} · {item.department}</span>
                      {item.visibility === "KU_ONLY" && <span>🔒 เฉพาะ KU</span>}
                      {past && (
                        <span className="rounded bg-wash px-1.5 py-0.5 font-medium">
                          จบไปแล้ว
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-sm font-medium leading-snug">{item.title}</h3>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
