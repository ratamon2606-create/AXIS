import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/enums";
import { getAuthState, type AuthState } from "@/lib/auth/auth-state";

type AuthenticatedState = Extract<AuthState, { authenticated: true }>;
type FullyAuthenticatedState = AuthenticatedState & { profileComplete: true };

/**
 * Required security order, steps 1-4: valid session, valid user, 2FA
 * enabled, 2FA verified for THIS exact session. Deliberately stops short
 * of the profile-complete check (step 5) so it can be used by /onboarding
 * itself without creating a redirect loop back into /onboarding.
 *
 * This is the authorization boundary, not a UX convenience: it runs
 * server-side, re-reads PostgreSQL through getAuthState() on every call,
 * and is meant to be called directly from every protected Server
 * Component, Route Handler, and Server Action — not relied on via a client
 * redirect or trusted from a JWT claim.
 */
export async function requireTwoFactorVerified(): Promise<AuthenticatedState> {
  const state = await getAuthState();

  if (!state.authenticated) {
    redirect("/login");
  }

  if (!state.twoFactorEnabled) {
    redirect("/auth/2fa/setup");
  }

  if (!state.twoFactorVerified) {
    redirect("/auth/2fa/verify");
  }

  return state;
}

/** Required security order, steps 1-5: the above, plus profile complete. */
export async function requireFullyAuthenticated(): Promise<FullyAuthenticatedState> {
  const state = await requireTwoFactorVerified();

  if (!state.profileComplete) {
    redirect("/onboarding");
  }

  return state as FullyAuthenticatedState;
}

/**
 * Required security order, step 6: role-based authorization for a specific
 * piece of functionality. No page in this step needs a restriction beyond
 * "any fully authenticated member" (feed/content/admin features are later
 * steps) — this exists so that future protected actions call one shared
 * function instead of checking `role` ad hoc inline.
 */
export function requireRole(state: FullyAuthenticatedState, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(state.role)) {
    redirect("/forbidden");
  }
}
