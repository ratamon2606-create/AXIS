import Bookshelf from "@/components/Bookshelf";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { visibleWhere } from "@/lib/items";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;

  const items = await db.contentItem.findMany({
    where: visibleWhere(!!session?.user),
    include: userId ? { savedBy: { where: { userId } } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const shelfItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    type: item.type,
    audience: item.audience,
    targetYear: item.targetYear,
    eventStart: item.eventStart?.toISOString() ?? null,
    expiresAt: item.expiresAt?.toISOString() ?? null,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    location: item.location,
    saved: "savedBy" in item && Array.isArray(item.savedBy) && item.savedBy.length > 0,
  }));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">Announcements</p>
        <h1 className="mt-1 text-xl">ชั้นหนังสือข่าวสาร</h1>
        <p className="mt-1 text-sm text-muted">เลือกประเภทเพื่อจัดชั้นใหม่ตามวันที่ที่เกี่ยวข้องกับประกาศ</p>
      </div>
      <Bookshelf items={shelfItems} />
    </div>
  );
}
