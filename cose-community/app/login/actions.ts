"use server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export type LoginState = { error: string | null };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = String(formData.get("identifier") || "");
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
    select: { id: true, email: true, username: true, passwordHash: true },
  });

  if (!user) {
    return { error: "Invalid credentials" };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "Invalid credentials" };
  }

  await createSessionCookie(user.id, user.username);
  redirect("/");
  return { error: null };
}


