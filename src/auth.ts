import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";
import { isAllowedUniversityEmail } from "@/lib/email-domain";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  // SRS-22 / URS-12: sessions live in PostgreSQL via Prisma so sign-out and
  // role changes are immediately authoritative server-side state, not a
  // claim baked into a client-held token.
  session: {
    strategy: "database",
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  providers: [Google],

  callbacks: {
    // SRS-9 / SRS-10: runs before any session is created. Only a verified
    // Google account on the exact @ku.th domain is allowed through; every
    // other case redirects to the error page with a reason the UI can
    // translate into a plain-language message, instead of exposing
    // Auth.js internals.
    async signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return false;
      }

      if (!profile?.email_verified) {
        return "/auth/error?error=AccessDenied&reason=unverified";
      }

      if (!isAllowedUniversityEmail(profile.email)) {
        return "/auth/error?error=AccessDenied&reason=domain";
      }

      return true;
    },

    // Database session strategy: `user` is the trusted Prisma row, never
    // client input. Only the fields the rest of the app needs are copied
    // onto the session; access/refresh tokens stay in the Account table
    // and are never exposed here.
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      session.user.twoFactorEnabled = user.twoFactorEnabled;
      return session;
    },
  },
});
