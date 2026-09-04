import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { signOut } from "@/auth";
import { getCurrentDbSession } from "@/lib/auth/current-session";
import { getOrCreatePendingTotpSecret } from "@/lib/auth/totp-enrollment";
import { buildOtpauthUri } from "@/lib/totp";

import { confirmTotpSetup } from "../actions";

type SearchParams = Promise<{ error?: string }>;

function formatSecretForDisplay(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

export default async function TwoFactorSetupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const dbSession = await getCurrentDbSession();
  if (!dbSession) {
    redirect("/login");
  }

  if (dbSession.user.twoFactorEnabled) {
    redirect(dbSession.twoFactorVerified ? "/" : "/auth/2fa/verify");
  }

  const secret = await getOrCreatePendingTotpSecret(dbSession.userId);
  const otpauthUri = buildOtpauthUri(secret, dbSession.user.email);
  const qrDataUrl = await QRCode.toDataURL(otpauthUri);

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-neutral-900">
            Set up two-factor authentication
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Scan this QR code with Google Authenticator, Microsoft
            Authenticator, Authy, 1Password, or any TOTP app.
          </p>
        </div>

        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt="Scan with your authenticator app"
            width={220}
            height={220}
            className="h-[220px] w-[220px] rounded-md border border-neutral-200"
          />
        </div>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Can&apos;t scan it? Enter this code manually:
        </p>
        <p className="mt-1 text-center font-mono text-sm tracking-wider text-neutral-800">
          {formatSecretForDisplay(secret)}
        </p>

        <form action={confirmTotpSetup} className="mt-6 flex flex-col gap-3">
          <label htmlFor="code" className="text-sm font-medium text-neutral-800">
            Enter the 6-digit code
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
            Enable two-factor authentication
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
