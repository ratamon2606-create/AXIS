"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { Program } from "@prisma/client";
import { validateProfile } from "@/lib/profile-validation";
function parseProfile(formData: FormData) {
  const program = String(formData.get("program") ?? "") as Program;
  const year = Number(formData.get("year") ?? 0);
  return {
    program,
    year,
  };
}
export async function saveProfile(formData: FormData) {
  const user = await requireUser();
  const { program, year, } = parseProfile(formData);
  const error = validateProfile(program, year);
  if (error) {
    redirect("/onboarding?err=" +
      encodeURIComponent(error));
  }
  await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      program,
      year,
    },
  });
  redirect("/");
}
export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const { program, year, } = parseProfile(formData);
  const error = validateProfile(program, year);
  if (error) {
    redirect("/me?err=" +
      encodeURIComponent(error));
  }
  await db.user.update({
    where: {
      id: user.id,
    },
    data: {
      program,
      year,
    },
  });
  revalidatePath("/");
  revalidatePath("/me");
  revalidatePath("/announcements");
  revalidatePath("/search");
  revalidatePath("/calendar");
  revalidatePath("/saved");
  redirect("/me?updated=1");
}
