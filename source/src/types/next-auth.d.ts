import type { Role, Department } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";
declare module "next-auth" {
  interface Session {
    twoFactorVerified: boolean;
    user: {
      id: string; email: string; name?: string | null; image?: string | null;
      role: Role; department: Department | null; year: number | null;
      twoFactorEnabled: boolean;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    twoFactorEnabled?: boolean;
    twoFactorVerified?: boolean;
  }
}
