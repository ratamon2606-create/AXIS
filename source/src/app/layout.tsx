import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

import { auth, signIn, signOut } from "@/lib/auth";
import {
  DesktopSidebar,
  MobileMenu,
  type MenuItem,
} from "@/components/Menu";
import {
  GOOGLE_FONTS_URL,
  DISPLAY_FONT,
  BODY_FONT,
} from "@/lib/fonts";

export const metadata: Metadata = {
  title: "AXIS · Department Information and Communication Hub",
  description:
    "ประกาศ เอกสาร และกิจกรรมของ CPE และ SKE รวมไว้ที่เดียว",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth().catch(() => null);

  const signedIn = !!session?.user;

  const canWrite =
    session?.user?.role === "EDITOR" ||
    session?.user?.role === "ADMIN";

  const items: MenuItem[] = [
    {
      href: "/",
      label: "หน้าแรก",
      icon: "⌂",
    },
    {
      href: "/announcements",
      label: "ข่าวสาร",
      icon: "▤",
    },
    {
      href: "/search",
      label: "ค้นหา",
      icon: "⌕",
    },
    {
      href: "/calendar",
      label: "ปฏิทิน",
      icon: "□",
    },

    ...(signedIn
      ? [
          {
            href: "/saved",
            label: "บันทึกไว้",
            icon: "★",
          },
          {
            href: "/me",
            label: "โปรไฟล์",
            icon: "○",
          },
        ]
      : []),

    ...(canWrite
      ? [
          {
            href: "/admin",
            label: "แผงผู้เขียน",
            icon: "✎",
          },
        ]
      : []),

    ...(session?.user?.role === "ADMIN"
      ? [
          {
            href: "/admin/users",
            label: "ผู้ใช้และสิทธิ์",
            icon: "♙",
          },
          {
            href: "/admin/audit",
            label: "บันทึกการใช้งาน",
            icon: "≡",
          },
        ]
      : []),
  ];

  const bottom = items.filter((item) =>
    [
      "/",
      "/announcements",
      "/search",
      "/calendar",
      "/saved",
    ].includes(item.href),
  );

  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />

        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        <link
          href={GOOGLE_FONTS_URL}
          rel="stylesheet"
        />

        <style>
          {`:root {
            --font-display: "${DISPLAY_FONT}", system-ui, sans-serif;
            --font-body: "${BODY_FONT}", system-ui, sans-serif;
          }`}
        </style>
      </head>

      <body className="bg-wash font-sans text-ink antialiased">
        <div className="axis-app-shell">
          {/* ===================================================
              GLOBAL HEADER
              =================================================== */}

          <header className="axis-app-header">
            <div className="axis-header-inner">
              <MobileMenu items={items} />

              <Link
                href="/"
                className="axis-brand"
              >
                <span className="axis-brand-name">
                  AXIS
                </span>

                <span className="axis-brand-subtitle">
                  Department Information and Communication Hub
                </span>
              </Link>

              <div className="axis-header-actions">
                <Link
                  href="/search"
                  className="axis-header-icon-button"
                  aria-label="ค้นหา"
                >
                  ⌕
                </Link>

                {signedIn ? (
                  <form
                    action={async () => {
                      "use server";

                      await signOut({
                        redirectTo: "/",
                      });
                    }}
                  >
                    <button className="axis-header-auth-button">
                      ออกจากระบบ
                    </button>
                  </form>
                ) : (
                  <form
                    action={async () => {
                      "use server";

                      await signIn(
                        "google",
                        {
                          redirectTo: "/",
                        },
                      );
                    }}
                  >
                    <button className="axis-header-auth-button axis-header-auth-button-primary">
                      เข้าสู่ระบบ
                    </button>
                  </form>
                )}
              </div>
            </div>
          </header>

          {/* ===================================================
              APP FRAME
              =================================================== */}

          <div className="axis-app-frame">
            <DesktopSidebar items={items} />

            <div className="axis-app-content">
              <main className="axis-app-main axis-page-shell">
                <div className="axis-route-content">
                  {children}
                </div>
              </main>

              <footer className="axis-app-footer axis-page-shell">
                AXIS · Department Information and Information Hub
              </footer>
            </div>
          </div>

          {/* ===================================================
              MOBILE BOTTOM NAVIGATION
              =================================================== */}

          <nav
            className="axis-mobile-bottom-nav axis-mobile-safe-bottom"
            style={{
              gridTemplateColumns: `repeat(${Math.max(
                bottom.length,
                1,
              )}, minmax(0, 1fr))`,
            }}
            aria-label="เมนูลัด"
          >
            {bottom.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="axis-mobile-bottom-link"
              >
                <span
                  className="axis-mobile-bottom-icon"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>

                <span className="axis-mobile-bottom-label">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </body>
    </html>
  );
}
