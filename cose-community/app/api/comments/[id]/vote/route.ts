import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	try {
		const { value } = await req.json();
		if (![1, -1, 0].includes(value)) {
			return NextResponse.json({ error: "Invalid vote value" }, { status: 400 });
		}
		const { id: commentId } = await context.params;
		const comment = await prisma.comment.findUnique({ where: { id: commentId } });
		if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

		if (value === 0) {
			await prisma.commentVote.deleteMany({ where: { userId: user.id, commentId } });
		} else {
			await prisma.commentVote.upsert({
				where: { userId_commentId: { userId: user.id, commentId } },
				update: { value },
				create: { userId: user.id, commentId, value },
			});
		}
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}


