"use client";

import Link from "next/link";
import {
  useState,
} from "react";
import {
  usePathname,
} from "next/navigation";

export type MenuItem = {
  href: string;
  label: string;
  icon?: string;
};

function MenuLinks({
  items,
  onSelect,
  compact = false,
}: {
  items: MenuItem[];
  onSelect?: () => void;
  compact?: boolean;
}) {
  const path = usePathname();

  return (
    <ul className="axis-menu-list">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? path === "/"
            : path === item.href ||
              path.startsWith(
                `${item.href}/`,
              );

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onSelect}
              title={
                compact
                  ? item.label
                  : undefined
              }
              className={[
                "axis-menu-link",

                compact
                  ? "axis-menu-link-compact"
                  : "",

                active
                  ? "is-active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span
                aria-hidden="true"
                className="axis-menu-icon"
              >
                {item.icon ?? "•"}
              </span>

              {!compact && (
                <span className="axis-menu-text">
                  {item.label}
                </span>
              )}

              {compact && (
                <span className="sr-only">
                  {item.label}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function MobileMenu({
  items,
}: {
  items: MenuItem[];
}) {
  const [
    open,
    setOpen,
  ] = useState(false);

  return (
    <div className="axis-mobile-menu md:hidden">
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        aria-label="เปิดเมนู"
        aria-expanded={open}
        className="axis-mobile-menu-trigger"
      >
        <i />
        <i />
        <i />
      </button>

      {open && (
        <div
          className="axis-mobile-drawer-backdrop"
          onClick={() =>
            setOpen(false)
          }
        >
          <nav
            className="axis-mobile-drawer"
            onClick={(event) =>
              event.stopPropagation()
            }
            aria-label="เมนูหลัก"
          >
            <div className="axis-mobile-drawer-head">
              <div className="min-w-0">
                <p className="axis-mobile-drawer-brand">
                  AXIS
                </p>

                <p className="axis-mobile-drawer-subtitle">
                  Department Information and Communication Hub
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="axis-mobile-drawer-close"
                aria-label="ปิดเมนู"
              >
                ✕
              </button>
            </div>

            <MenuLinks
              items={items}
              onSelect={() =>
                setOpen(false)
              }
            />
          </nav>
        </div>
      )}
    </div>
  );
}

export function DesktopSidebar({
  items,
}: {
  items: MenuItem[];
}) {
  return (
    <aside className="axis-desktop-sidebar">
      <div className="axis-sidebar-inner">
        <p className="axis-sidebar-title">
          เมนู
        </p>

        <div className="axis-sidebar-compact">
          <MenuLinks
            items={items}
            compact
          />
        </div>

        <div className="axis-sidebar-expanded">
          <MenuLinks
            items={items}
          />
        </div>
      </div>
    </aside>
  );
}
