import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// instance แยกต่างหาก ใช้ authConfig ที่ไม่แตะ Prisma เพื่อให้รันบน edge runtime ได้
const { auth } = NextAuth(authConfig);

const PUBLIC_PREFIXES = ["/api/auth", "/denied", "/setup-2fa", "/verify-2fa"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return;
  }

  const session = req.auth;
  if (!session?.user) return;

  if (!session.user.twoFactorEnabled) {
    return NextResponse.redirect(new URL("/setup-2fa", req.nextUrl));
  }
  if (!session.twoFactorVerified) {
    return NextResponse.redirect(new URL("/verify-2fa", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
