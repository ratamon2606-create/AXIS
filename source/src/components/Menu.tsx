"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export default function Menu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="เปิดเมนู"
        className="flex h-8 w-8 flex-col items-center justify-center gap-[3px] rounded-full border-[1.5px] border-ink"
      >
        <i className="block h-[1.5px] w-3.5 bg-ink" />
        <i className="block h-[1.5px] w-3.5 bg-ink" />
        <i className="block h-[1.5px] w-3.5 bg-ink" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/40"
          onClick={() => setOpen(false)}
        >
          <nav
            className="absolute left-0 top-0 h-full w-72 bg-paper p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center">
              <span className="font-display text-lg">เมนู</span>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto grid h-8 w-8 place-items-center rounded-xl bg-wash"
                aria-label="ปิดเมนู"
              >
                ✕
              </button>
            </div>
            <ul>
              {items.map((it) => (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={`block border-b border-line px-3 py-3 text-sm ${
                      path === it.href ? "bg-brandsoft font-medium text-branddeep" : ""
                    }`}
                  >
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
