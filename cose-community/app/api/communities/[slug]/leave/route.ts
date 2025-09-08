import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
	const user = await getCurrentUser();
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const { slug } = await context.params;
	const community = await prisma.community.findUnique({ where: { slug } });
	if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

	await prisma.membership.deleteMany({
		where: { userId: user.id, communityId: community.id, role: { in: ["MEMBER", "MODERATOR"] } },
	});
	return NextResponse.json({ ok: true });
}
