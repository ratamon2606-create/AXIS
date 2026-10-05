"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

function MenuLinks({ items, onSelect }: { items: Item[]; onSelect?: () => void }) {
  const path = usePathname();

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = item.href === "/" ? path === "/" : path === item.href || path.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onSelect}
              className={`block rounded-xl px-3 py-2.5 text-sm transition ${
                active ? "bg-brandsoft font-medium text-branddeep" : "text-ink hover:bg-wash"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function MobileMenu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="เปิดเมนู"
        aria-expanded={open}
        className="flex h-8 w-8 flex-col items-center justify-center gap-[3px] rounded-full border-[1.5px] border-ink"
      >
        <i className="block h-[1.5px] w-3.5 bg-ink" />
        <i className="block h-[1.5px] w-3.5 bg-ink" />
        <i className="block h-[1.5px] w-3.5 bg-ink" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40" onClick={() => setOpen(false)}>
          <nav className="h-full w-72 bg-paper p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center">
              <span className="font-display text-lg">เมนู</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto grid h-8 w-8 place-items-center rounded-xl bg-wash"
                aria-label="ปิดเมนู"
              >
                ✕
              </button>
            </div>
            <MenuLinks items={items} onSelect={() => setOpen(false)} />
          </nav>
        </div>
      )}
    </div>
  );
}

export function DesktopSidebar({ items }: { items: Item[] }) {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-line bg-paper sm:block">
      <div className="sticky top-[57px] p-4">
        <p className="mb-3 px-3 text-xs font-medium text-faint">เมนู</p>
        <MenuLinks items={items} />
      </div>
    </aside>
  );
}
