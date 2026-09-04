import type { Role } from "@/generated/prisma/enums";
import type { User } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentDbSession } from "@/lib/auth/current-session";

/**
 * The single authoritative, server-only source of truth for "who is this
 * request, and how far through the auth flow are they" — resolved fresh
 * from PostgreSQL on every call via the exact current session cookie.
 * Never derived from localStorage, React state, or anything client-held.
 */
export type AuthState =
  | {
      authenticated: false;
      user: null;
      role: null;
      twoFactorEnabled: false;
      twoFactorVerified: false;
      profileComplete: false;
    }
  | {
      authenticated: true;
      user: User;
      role: Role;
      twoFactorEnabled: boolean;
      twoFactorVerified: boolean;
      profileComplete: boolean;
    };

const UNAUTHENTICATED: AuthState = {
  authenticated: false,
  user: null,
  role: null,
  twoFactorEnabled: false,
  twoFactorVerified: false,
  profileComplete: false,
};

export async function getAuthState(): Promise<AuthState> {
  const dbSession = await getCurrentDbSession();

  if (!dbSession) {
    return UNAUTHENTICATED;
  }

  // "valid User?" (required security order, step 2). The schema's
  // onDelete: Cascade on Session.user means an orphaned session pointing
  // at a deleted user cannot normally exist — but a security boundary
  // should not simply trust that invariant. If it's ever violated, end
  // the broken session server-side rather than treating it as valid.
  if (!dbSession.user) {
    await prisma.session
      .delete({ where: { sessionToken: dbSession.sessionToken } })
      .catch(() => {});
    return UNAUTHENTICATED;
  }

  const { user } = dbSession;
  const profileComplete =
    user.studentId != null && user.department != null && user.yearOfStudy != null;

  return {
    authenticated: true,
    user,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    twoFactorVerified: dbSession.twoFactorVerified,
    profileComplete,
  };
}
