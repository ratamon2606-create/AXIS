import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { auth, signIn, signOut } from "@/lib/auth";
import { DesktopSidebar, MobileMenu } from "@/components/Menu";
import { GOOGLE_FONTS_URL, DISPLAY_FONT, BODY_FONT } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "AXIS · Department Information Hub",
  description: "ประกาศ เอกสาร และกิจกรรมของ CPE และ SKE รวมไว้ที่เดียว",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth().catch(() => null);
  const signedIn = !!session?.user;
  const canWrite = session?.user?.role === "EDITOR" || session?.user?.role === "ADMIN";

  const items = [
    { href: "/", label: "หน้าแรก" },
    { href: "/announcements", label: "ข่าวสาร" },
    { href: "/search", label: "ค้นหา" },
    { href: "/calendar", label: "ปฏิทิน" },
    ...(signedIn ? [{ href: "/saved", label: "บันทึกไว้" }, { href: "/me", label: "โปรไฟล์" }] : []),
    ...(canWrite ? [{ href: "/admin", label: "แผงผู้เขียน" }] : []),
    ...(session?.user?.role === "ADMIN"
      ? [
          { href: "/admin/users", label: "ผู้ใช้และสิทธิ์" },
          { href: "/admin/audit", label: "บันทึกการใช้งาน" },
        ]
      : []),
  ];

  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
        <style>{`:root { --font-display: "${DISPLAY_FONT}", system-ui, sans-serif; --font-body: "${BODY_FONT}", system-ui, sans-serif; }`}</style>
      </head>
      <body className="bg-wash font-sans text-ink antialiased">
        <div className="mx-auto min-h-screen w-full max-w-6xl bg-wash">
          <header className="sticky top-0 z-30 flex h-[57px] items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur sm:px-6">
            <MobileMenu items={items} />
            <Link href="/" className="font-display text-base">AXIS</Link>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/search" className="grid h-8 w-8 place-items-center rounded-xl bg-wash text-sm" aria-label="ค้นหา">🔍</Link>
              {signedIn ? (
                <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                  <button className="rounded-xl border border-line px-3 py-1.5 text-xs">ออกจากระบบ</button>
                </form>
              ) : (
                <form action={async () => { "use server"; await signIn("google", { redirectTo: "/" }); }}>
                  <button className="rounded-xl bg-brand px-3 py-1.5 text-xs text-white">เข้าสู่ระบบ</button>
                </form>
              )}
            </div>
          </header>

          <div className="flex min-h-[calc(100vh-57px)]">
            <DesktopSidebar items={items} />
            <div className="min-w-0 flex-1">
              <main className="px-4 py-5 pb-24 sm:px-6 sm:py-7 sm:pb-7">{children}</main>
              <footer className="px-4 pb-20 pt-8 text-center text-xs text-faint sm:pb-10">
                AXIS · Department Information Hub
              </footer>
            </div>
          </div>

          <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-around border-t border-line bg-paper/95 px-2 py-2 text-[11px] backdrop-blur sm:hidden">
            <Link href="/">Home</Link>
            <Link href="/announcements">News</Link>
            <Link href="/search">Search</Link>
            <Link href="/calendar">Calendar</Link>
            {signedIn && <Link href="/saved">Saved</Link>}
          </nav>
        </div>
      </body>
    </html>
  );
}
