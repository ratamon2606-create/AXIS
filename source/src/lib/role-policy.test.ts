import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { assertAdminRetention } from "./role-policy";

function transaction(administratorCount: number) {
  const count = vi.fn().mockResolvedValue(administratorCount);
  return { tx: { user: { count } } as unknown as Prisma.TransactionClient, count };
}

describe("administrator retention", () => {
  it("allows non-admin role changes without counting administrators", async () => {
    const { tx, count } = transaction(0);
    await assertAdminRetention(tx, "EDITOR", "READER");
    expect(count).not.toHaveBeenCalled();
  });

  it("allows promoting an account to administrator", async () => {
    const { tx, count } = transaction(0);
    await assertAdminRetention(tx, "READER", "ADMIN");
    expect(count).not.toHaveBeenCalled();
  });

  it("rejects removing the last administrator", async () => {
    const { tx, count } = transaction(1);
    await expect(assertAdminRetention(tx, "ADMIN", "EDITOR")).rejects.toThrow(
      "ต้องมีผู้ดูแลอย่างน้อยหนึ่งคนในระบบ",
    );
    expect(count).toHaveBeenCalledWith({ where: { role: "ADMIN" } });
  });

  it("allows an administrator downgrade when another one remains", async () => {
    const { tx } = transaction(2);
    await expect(assertAdminRetention(tx, "ADMIN", "READER")).resolves.toBeUndefined();
  });
});
