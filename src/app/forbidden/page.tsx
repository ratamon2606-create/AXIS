import Link from "next/link";

// Redirect target for requireRole() (required security order, step 6).
// Not reachable from anywhere in this step — no page yet restricts by role
// beyond "any fully authenticated member" — but the target must exist for
// that guard to be complete and testable.
export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 text-center">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-900">
          You don&apos;t have permission to view this page
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          Your account doesn&apos;t have the role required for this part of
          AXIS.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Return to AXIS
        </Link>
      </div>
    </main>
  );
}
