import { cookies } from "next/headers";
import { signJwt, verifyJwt } from "./jwt";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "session";

export async function createSessionCookie(userId: string, username: string): Promise<void> {
  const token = signJwt({ sub: userId, username });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyJwt<{ sub: string; username: string }>(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, email: true, createdAt: true, role: true, banned: true },
  });
  return user;
}


