import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validators/auth";
import { hashPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
	try {
		const json = await req.json();
		const parsed = registerSchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid input" }, { status: 400 });
		}

		const { email, username, password } = parsed.data;

		const existing = await prisma.user.findFirst({
			where: { OR: [{ email }, { username }] },
		});
		if (existing) {
			return NextResponse.json({ error: "User already exists" }, { status: 409 });
		}

		const passwordHash = await hashPassword(password);
		const user = await prisma.user.create({
			data: { email, username, passwordHash },
			select: { id: true, email: true, username: true, createdAt: true },
		});

		await createSessionCookie(user.id, user.username);
		return NextResponse.json({ user }, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
