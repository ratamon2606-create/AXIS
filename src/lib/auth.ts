import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import type { Role, Department } from "@prisma/client";

/** โดเมนที่อนุญาต อ่านจาก env เพื่อให้เพิ่มโดเมนของบุคลากรได้โดยไม่ต้องแก้โค้ด */
function allowedDomains(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "ku.th")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * SRS-10 ตรวจโดเมนฝั่ง server เสมอ
 * ไม่เชื่อค่า hd ที่ Google ส่งมาอย่างเดียวเพราะเป็นเพียง hint
 */
export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && allowedDomains().includes(domain);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { error: "/denied" },
  callbacks: {
    async signIn({ profile }) {
      if (!isAllowedEmail(profile?.email)) return "/denied?reason=domain";

      const email = profile!.email!.toLowerCase();
      const existing = await db.user.findUnique({ where: { email } });

      if (!existing) {
        // SRS-11 บัญชีใหม่ได้สิทธิ์ผู้อ่าน เว้นแต่มีอีเมลอยู่ในรายชื่อที่ใส่ไว้ล่วงหน้า
        const invite = await db.allowlist.findUnique({ where: { email } });
        await db.user.create({
          data: {
            email,
            name: profile?.name ?? null,
            image: (profile as { picture?: string })?.picture ?? null,
            role: invite?.role ?? "READER",
          },
        });
      }
      return true;
    },

    async jwt({ token }) {
      if (!token.email) return token;
      const user = await db.user.findUnique({
        where: { email: token.email.toLowerCase() },
      });
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.department = user.department;
        token.year = user.year;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.role = token.role as Role;
      session.user.department = (token.department as Department) ?? null;
      session.user.year = (token.year as number) ?? null;
      return session;
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return session.user;
}

/** SRS-13 เขียนได้เฉพาะผู้เขียนและผู้ดูแล */
export async function requireEditor() {
  const user = await requireUser();
  if (user.role !== "EDITOR" && user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
