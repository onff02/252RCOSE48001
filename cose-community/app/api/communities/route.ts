import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCommunitySchema } from "@/lib/validators/community";
import { slugify } from "@/lib/slug";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
	const communities = await prisma.community.findMany({
		orderBy: { createdAt: "desc" },
		select: { id: true, name: true, slug: true, title: true, description: true },
	});
	return NextResponse.json({ communities });
}

export async function POST(req: NextRequest) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	try {
		const json = await req.json();
		const parsed = createCommunitySchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid input" }, { status: 400 });
		}
		const { name, title, description } = parsed.data;
		const slug = slugify(name);

		const exists = await prisma.community.findFirst({ where: { OR: [{ name }, { slug }] } });
		if (exists) {
			return NextResponse.json({ error: "Community already exists" }, { status: 409 });
		}

		const created = await prisma.community.create({
			data: {
				name,
				slug,
				title,
				description: description || null,
				creatorId: user.id,
				memberships: {
					create: {
						userId: user.id,
						role: "OWNER",
					},
				},
			},
			select: { id: true, name: true, slug: true, title: true, description: true },
		});
		return NextResponse.json({ community: created }, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}
