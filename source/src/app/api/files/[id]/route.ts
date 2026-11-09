import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canReadItemWithParent } from "@/lib/items";
import { signedDownloadUrl, signedInlineUrl } from "@/lib/s3";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attachment = await db.attachment.findUnique({ where: { id }, include: { item: { include: { parent: { select: { status: true, visibility: true } } } } } });
  if (!attachment) return new NextResponse("Not found", { status: 404 });

  const session = await auth().catch(() => null);
  const canPreviewDraft = !!session?.user && attachment.item.status === "DRAFT" && !attachment.item.parentId &&
    (session.user.role === "ADMIN" || (session.user.role === "EDITOR" && session.user.id === attachment.item.authorId));
  const adminCanInspectHidden = session?.user?.role === "ADMIN" && attachment.item.status === "HIDDEN" && !attachment.item.parentId;
  if (!canReadItemWithParent(attachment.item, !!session?.user) && !adminCanInspectHidden && !canPreviewDraft) {
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
