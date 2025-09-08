import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createPostSchema } from "@/lib/validators/post";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const community = searchParams.get("community");
	const take = Math.min(Number(searchParams.get("take") || 20), 50);
	const cursor = searchParams.get("cursor") || undefined;

	const where = community ? { community: { slug: community } } : {};

	const posts = await prisma.post.findMany({
		where,
		take: take + 1,
		cursor: cursor ? { id: cursor } : undefined,
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			title: true,
			content: true,
			createdAt: true,
			community: { select: { slug: true, name: true, title: true } },
			author: { select: { id: true, username: true } },
			votes: { select: { value: true } },
		},
	});

	let nextCursor: string | null = null;
	if (posts.length > take) {
		nextCursor = posts[posts.length - 1].id;
		posts.pop();
	}

	const withScore = posts.map((p) => ({
		...p,
		score: p.votes.reduce((acc, v) => acc + v.value, 0),
	}));

	return NextResponse.json({ posts: withScore, nextCursor });
}

export async function POST(req: NextRequest) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	try {
		const json = await req.json();
		const parsed = createPostSchema.safeParse(json);
		if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

		const { communitySlug, title, content } = parsed.data;
		const community = await prisma.community.findUnique({ where: { slug: communitySlug } });
		if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });

		const post = await prisma.post.create({
			data: { title, content, authorId: user.id, communityId: community.id },
			select: { id: true, title: true, content: true, createdAt: true },
		});
		return NextResponse.json({ post }, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}


