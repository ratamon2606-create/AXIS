import type { NextAuthConfig } from "next-auth";
import type { Role, Department } from "@prisma/client";

/**
 * ส่วนที่ใช้ได้ทั้งใน middleware (edge) และฝั่ง Node
 * ห้าม import อะไรที่แตะฐานข้อมูล (เช่น @/lib/db) เข้ามาในไฟล์นี้
 * เพราะ Prisma client รันบน edge runtime ไม่ได้ — providers เติมทีหลังใน auth.ts
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { error: "/denied" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.role = token.role as Role;
      session.user.department = (token.department as Department) ?? null;
      session.user.year = (token.year as number) ?? null;
      session.user.twoFactorEnabled = !!token.twoFactorEnabled;
      session.twoFactorVerified = !!token.twoFactorVerified;
      return session;
    },
  },
} satisfies NextAuthConfig;
