import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import type { Role, Program } from "@prisma/client";

function allowedDomains(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "ku.th")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

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
        token.program = user.program;
        token.year = user.year;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.role = token.role as Role;
      session.user.program = (token.program as Program) ?? null;
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

export async function requireEditor() {
  const user = await requireUser();
  if (user.role !== "EDITOR" && user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
