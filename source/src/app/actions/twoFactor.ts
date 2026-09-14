"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, unstable_update } from "@/lib/auth";
import {
  verifyTwoFactorCode,
  TWO_FACTOR_MAX_ATTEMPTS,
  TWO_FACTOR_LOCK_MINUTES,
} from "@/lib/twoFactor";

function extractCode(formData: FormData): string {
  return String(formData.get("code") ?? "").trim();
}

export async function confirmTwoFactorSetup(formData: FormData) {
  const user = await requireUser();
  const dbUser = await db.user.findUnique({ where: { id: user.id } });

  if (!dbUser?.twoFactorSecret) {
    redirect("/setup-2fa?err=" + encodeURIComponent("ยังไม่ได้สร้างรหัสลับ ลองโหลดหน้าใหม่"));
  }
  if (dbUser.twoFactorEnabled) {
    redirect("/verify-2fa");
  }

  const code = extractCode(formData);
  const ok = verifyTwoFactorCode(dbUser.twoFactorSecret, dbUser.email, code);
  if (!ok) {
    redirect("/setup-2fa?err=" + encodeURIComponent("รหัสไม่ถูกต้อง ลองใหม่อีกครั้ง"));
  }

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true, twoFactorFailedAttempts: 0, twoFactorLockedUntil: null },
  });
  await unstable_update({ twoFactorVerified: true });
  redirect("/");
}

export async function verifyTwoFactorLogin(formData: FormData) {
  const user = await requireUser();
  const dbUser = await db.user.findUnique({ where: { id: user.id } });

  if (!dbUser?.twoFactorEnabled || !dbUser.twoFactorSecret) {
    redirect("/setup-2fa");
  }

  if (dbUser.twoFactorLockedUntil && dbUser.twoFactorLockedUntil > new Date()) {
    redirect(
      "/verify-2fa?err=" +
        encodeURIComponent(`กรอกรหัสผิดหลายครั้งเกินไป กรุณารออีกสักครู่แล้วลองใหม่`),
    );
  }

  const code = extractCode(formData);
  const ok = verifyTwoFactorCode(dbUser.twoFactorSecret, dbUser.email, code);

  if (!ok) {
    const attempts = dbUser.twoFactorFailedAttempts + 1;
    if (attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
      await db.user.update({
        where: { id: user.id },
        data: {
          twoFactorFailedAttempts: 0,
          twoFactorLockedUntil: new Date(Date.now() + TWO_FACTOR_LOCK_MINUTES * 60_000),
        },
      });
      redirect(
        "/verify-2fa?err=" +
          encodeURIComponent(
            `กรอกรหัสผิดครบ ${TWO_FACTOR_MAX_ATTEMPTS} ครั้ง กรุณารอ ${TWO_FACTOR_LOCK_MINUTES} นาทีแล้วลองใหม่`,
          ),
      );
    }
    await db.user.update({
      where: { id: user.id },
      data: { twoFactorFailedAttempts: attempts },
    });
    redirect("/verify-2fa?err=" + encodeURIComponent("รหัสไม่ถูกต้อง ลองใหม่อีกครั้ง"));
  }

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorFailedAttempts: 0, twoFactorLockedUntil: null },
  });
  await unstable_update({ twoFactorVerified: true });
  redirect("/");
}
