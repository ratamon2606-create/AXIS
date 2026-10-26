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
    include: {
      // The first image attachment becomes the visual cover on the bookshelf.
      // Files still go through /api/files/:id, so the existing access policy
      // remains the gate before MinIO returns a short-lived signed URL.
      attachments: {
        where: { mimeType: { startsWith: "image/" } },
        select: { id: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      savedBy: {
        where: { userId: userId ?? "__visitor__" },
        select: { userId: true },
      },
    },
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
    eventEnd: item.eventEnd?.toISOString() ?? null,
    expiresAt: item.expiresAt?.toISOString() ?? null,
    publishedAt: item.publishedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    location: item.location,
    saved: item.savedBy.length > 0,
    coverAttachmentId: item.attachments[0]?.id ?? null,
  }));

  return (
    <div className="space-y-5">
      <div className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand">ข่าวสาร</p>
        <h1 className="mt-1 text-2xl sm:text-3xl">ข่าวสารทั้งหมด</h1>
        <p className="mt-1 text-sm leading-6 text-muted">
          สำรวจข่าว
        </p>
      </div>
      <Bookshelf items={shelfItems} />
    </div>
  );
}
