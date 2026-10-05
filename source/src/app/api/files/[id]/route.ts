import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canReadItem } from "@/lib/items";
import { signedDownloadUrl, signedInlineUrl } from "@/lib/s3";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attachment = await db.attachment.findUnique({ where: { id }, include: { item: true } });
  if (!attachment) return new NextResponse("Not found", { status: 404 });

  const session = await auth().catch(() => null);
  const adminCanInspectHidden = session?.user?.role === "ADMIN" && attachment.item.status === "HIDDEN";
  if (!canReadItem(attachment.item, !!session?.user) && !adminCanInspectHidden) {
    return new NextResponse("Not found", { status: 404 });
  }

  const requestUrl = new URL(req.url);
  const wantsInline = requestUrl.searchParams.get("view") === "1";
  const canInline = wantsInline && attachment.mimeType.startsWith("image/");

  const url = canInline
    ? await signedInlineUrl(attachment.storageKey, attachment.fileName)
    : await signedDownloadUrl(attachment.storageKey, attachment.fileName);

  return NextResponse.redirect(url, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
