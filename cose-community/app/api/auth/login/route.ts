import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validators/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
	try {
		const json = await req.json();
		const parsed = loginSchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid input" }, { status: 400 });
		}
		const { identifier, password } = parsed.data;

		const user = await prisma.user.findFirst({
			where: {
				OR: [{ email: identifier }, { username: identifier }],
			},
			select: { id: true, email: true, username: true, passwordHash: true, banned: true },
		});
		if (!user) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		if (user.banned) {
			return NextResponse.json({ error: "Account banned" }, { status: 403 });
		}

		const ok = await verifyPassword(password, user.passwordHash);
		if (!ok) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		await createSessionCookie(user.id, user.username);
		return NextResponse.json({ user: { id: user.id, email: user.email, username: user.username } }, { status: 200 });
	} catch {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
