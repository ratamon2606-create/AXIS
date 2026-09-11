import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { auth, signIn, signOut } from "@/lib/auth";
import Menu from "@/components/Menu";
import { GOOGLE_FONTS_URL, DISPLAY_FONT, BODY_FONT } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "ศูนย์ข่าวสารภาควิชา CPE / SKE",
  description: "ประกาศ เอกสาร และกิจกรรมของภาควิชา รวมไว้ที่เดียว",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth().catch(() => null);
  const signedIn = !!session?.user;
  const canWrite = session?.user?.role === "EDITOR" || session?.user?.role === "ADMIN";

  const items = [
    { href: "/", label: "ประกาศ" },
    { href: "/search", label: "ค้นหา" },
    ...(signedIn ? [{ href: "/me", label: "โปรไฟล์" }] : []),
    ...(canWrite ? [{ href: "/admin", label: "แผงผู้ดูแล" }] : []),
  ];

  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
        <style>{`
          :root {
            --font-display: "${DISPLAY_FONT}", system-ui, sans-serif;
            --font-body: "${BODY_FONT}", system-ui, sans-serif;
          }
        `}</style>
      </head>
      <body className="bg-wash font-sans text-ink antialiased">
        <div className="mx-auto min-h-screen w-full max-w-md bg-wash sm:max-w-2xl lg:max-w-5xl">
          <header className="flex items-center gap-3 border-b border-line bg-paper px-4 py-3 sm:px-6">
            <Menu items={items} />
            <Link href="/" className="font-display text-base">
              ศูนย์ข่าวสารภาควิชา
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/search"
                className="grid h-8 w-8 place-items-center rounded-xl bg-wash text-sm"
                aria-label="ค้นหา"
              >
                🔍
              </Link>
              {signedIn ? (
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button className="rounded-xl border border-line px-3 py-1.5 text-xs">
                    ออกจากระบบ
                  </button>
                </form>
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/" });
                  }}
                >
                  <button className="rounded-xl bg-brand px-3 py-1.5 text-xs text-white">
                    เข้าสู่ระบบ
                  </button>
                </form>
              )}
            </div>
          </header>

          <main className="px-4 py-4 sm:px-6 sm:py-6">{children}</main>

          <footer className="px-4 pb-10 pt-6 text-center text-xs text-faint">
            ระบบต้นแบบสำหรับวิชา ISP · ยังไม่ใช่ประกาศทางการของภาควิชา
          </footer>
        </div>
      </body>
    </html>
  );
}
