import type { Prisma, Role } from "@prisma/client";

export async function assertAdminRetention(
  tx: Prisma.TransactionClient,
  currentRole: Role,
  nextRole: Role,
): Promise<void> {
  if (currentRole !== "ADMIN" || nextRole === "ADMIN") return;
  const administratorCount = await tx.user.count({ where: { role: "ADMIN" } });
  if (administratorCount <= 1) {
    throw new Error("ต้องมีผู้ดูแลอย่างน้อยหนึ่งคนในระบบ");
  }
}
