"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

export function BackToPrevious({
  fallbackHref = "/announcements",
  preferFallback = false,
}: {
  fallbackHref?: string;
  preferFallback?: boolean;
}) {
  const router = useRouter();
  const safeFallback = /^\/announcements(?:\/|\?|#|$)/.test(fallbackHref)
    ? fallbackHref
    : "/announcements";

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    if (preferFallback) return;

    if (window.history.length > 1) {
      event.preventDefault();
      router.back();
    }
  }

  return (
    <Link
      href={safeFallback}
      onClick={handleClick}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-paper px-3 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
    >
      <span aria-hidden="true">←</span>
      ย้อนกลับ
    </Link>
  );
}
