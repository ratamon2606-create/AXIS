import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { getCurrentDbSession } from "@/lib/auth/current-session";

import { confirmTotpLogin } from "../actions";

type SearchParams = Promise<{ error?: string }>;

export default async function TwoFactorVerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const dbSession = await getCurrentDbSession();
  if (!dbSession) {
    redirect("/login");
  }

  if (!dbSession.user.twoFactorEnabled) {
    redirect("/auth/2fa/setup");
  }

  if (dbSession.twoFactorVerified) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-neutral-900">
            Enter your verification code
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Open your authenticator app and enter the current 6-digit code
            for AXIS.
          </p>
        </div>

        <form action={confirmTotpLogin} className="flex flex-col gap-3">
          <label htmlFor="code" className="text-sm font-medium text-neutral-800">
            Verification code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            className="rounded-md border border-neutral-300 px-3 py-2 text-center text-lg tracking-[0.5em] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          />

          {error ? (
            <p className="text-sm text-red-600">
              Invalid verification code. Please try again.
            </p>
          ) : null}

          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Verify
          </button>
        </form>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="mt-4 text-center"
        >
          <button
            type="submit"
            className="text-xs text-neutral-500 underline hover:text-neutral-700"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
