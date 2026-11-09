import type { Prisma, AuditAction } from "@prisma/client";
import { db } from "@/lib/db";


type AuditInput = {
  actorId: string;
  action: AuditAction;
  itemId?: string | null;
  detail?: string | null;
};

export async function writeAudit(
  tx: Prisma.TransactionClient,
  input: AuditInput
): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorId: input.actorId,
      itemId: input.itemId ?? null,
      action: input.action,
      detail: input.detail ?? null,
    },
  });
}

export async function writeAuditStandalone(input: AuditInput): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: input.actorId,
      itemId: input.itemId ?? null,
      action: input.action,
      detail: input.detail ?? null,
    },
  });
}

export async function recentAudit(take = 100) {
  return db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { email: true, name: true } },
      item: { select: { id: true, title: true } },
    },
  });
}
