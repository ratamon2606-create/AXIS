import Link from "next/link";

type SearchParams = Promise<{
  error?: string;
  reason?: string;
}>;

function describeError(error: string | undefined, reason: string | undefined): string {
  if (reason === "domain") {
    return "Access denied. Please sign in using your @ku.th university account.";
  }

  if (reason === "unverified") {
    return "Your Google account could not be verified. Please use a verified Google account and try again.";
  }

  switch (error) {
    case "AccessDenied":
      return "Access denied. Please sign in using your @ku.th university account.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCallbackError":
    case "OAuthCreateAccount":
    case "Callback":
      return "We couldn't complete sign-in with Google. Please try again.";
    case "Configuration":
      return "Sign-in is temporarily unavailable. Please try again later.";
    default:
      return "Something went wrong while signing you in. Please try again.";
  }
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, reason } = await searchParams;
  const message = describeError(error, reason);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-900">
          Sign-in failed
        </h1>
        <p className="mt-3 text-sm text-neutral-600">{message}</p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Try signing in again
          </Link>
          <Link
            href="/"
            className="w-full rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Return to AXIS
          </Link>
        </div>
      </div>
    </main>
  );
}
