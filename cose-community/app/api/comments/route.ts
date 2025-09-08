import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createCommentSchema } from "@/lib/validators/comment";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const postId = searchParams.get("postId");
	if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

	const comments = await prisma.comment.findMany({
		where: { postId },
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			content: true,
			createdAt: true,
			parentId: true,
			author: { select: { id: true, username: true } },
			votes: { select: { value: true } },
		},
	});

	const withScore = comments.map((c) => ({ ...c, score: c.votes.reduce((a, v) => a + v.value, 0) }));
	return NextResponse.json({ comments: withScore });
}

export async function POST(req: NextRequest) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	try {
		const json = await req.json();
		const parsed = createCommentSchema.safeParse(json);
		if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

		const { postId, content, parentId } = parsed.data;
		const post = await prisma.post.findUnique({ where: { id: postId } });
		if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

		if (parentId) {
			const parent = await prisma.comment.findUnique({ where: { id: parentId } });
			if (!parent) return NextResponse.json({ error: "Parent comment not found" }, { status: 400 });
		}

		const comment = await prisma.comment.create({
			data: { content, authorId: user.id, postId, parentId: parentId || null },
			select: { id: true, content: true, createdAt: true, parentId: true },
		});
		return NextResponse.json({ comment }, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}


