import type { Role, Department } from "@prisma/client";
import "next-auth";
declare module "next-auth" {
  interface Session {
    user: {
      id: string; email: string; name?: string | null; image?: string | null;
      role: Role; department: Department | null; year: number | null;
    };
  }
}
