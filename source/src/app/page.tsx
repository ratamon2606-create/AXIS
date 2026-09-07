import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { visibleWhere } from "@/lib/items";
import Card from "@/components/Card";

/**
 * ฟีดหลัก: ดึงจาก server เท่านั้น ห้ามกรอง visibility ฝั่ง browser
 * SRS-1/SRS-8 บังคับผ่าน visibleWhere ซึ่งฝัง OR ของ expiresAt และเงื่อนไข visibility ไว้แล้ว
 */
export default async function HomePage() {
  const session = await auth();
  const signedIn = Boolean(session?.user?.id);

  const items = await db.contentItem.findMany({
    where: visibleWhere(signedIn),
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="text-sm text-faint">ยังไม่มีประกาศ</p>
      ) : (
        items.map((item) => <Card key={item.id} item={item} />)
      )}
    </div>
  );
}
