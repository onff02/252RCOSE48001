import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import Link from "next/link";

function getOrderClause(sort: string | null) {
  if (sort === "views") return { createdAt: "desc" as const };
  return { createdAt: "desc" as const };
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
	const community = await prisma.community.findUnique({ where: { slug: params.slug } });
	return { title: community ? community.name : "Community" };
}

export default async function CommunityPage({ params, searchParams }: { params: { slug: string }, searchParams: Promise<{ sort?: string }> }) {
	const community = await prisma.community.findUnique({
		where: { slug: params.slug },
		select: { id: true, name: true, slug: true, title: true, description: true },
	});
	if (!community) return <div>Not found</div>;

	async function createPost(formData: FormData) {
		"use server";
		const title = String(formData.get("title") || "");
		const content = String(formData.get("content") || "");
		const user = await getCurrentUser();
		if (!user) return;
		const community = await prisma.community.findUnique({ where: { slug: params.slug } });
		if (!community) return;
		await prisma.post.create({ data: { title, content, authorId: user.id, communityId: community.id } });
		revalidatePath(`/c/${params.slug}`);
	}

	const { sort } = await searchParams;
	const now = new Date();
	const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const isPopular = sort === "popular";
	const isViews = sort === "views";

	const posts = await prisma.post.findMany({
		where: { communityId: community.id },
		orderBy: getOrderClause(sort || null),
		select: {
			id: true,
			title: true,
			createdAt: true,
			author: { select: { username: true } },
			votes: isPopular ? { select: { value: true }, where: { createdAt: { gte: since24h } } } : { select: { value: true } },
			_count: { select: { views: true } },
		},
	});

	type Enriched = {
		id: string;
		title: string;
		createdAt: Date;
		author: { username: string };
		score: number;
		viewCount: number;
		popularity?: number;
	};

	const enriched: Enriched[] = posts.map((p) => {
		const scoreVotes = p.votes.reduce((a, v) => a + v.value, 0);
		const viewCount = p._count.views;
		const popularity = isPopular ? scoreVotes + viewCount : undefined;
		return { id: p.id, title: p.title, createdAt: p.createdAt, author: p.author, score: scoreVotes, viewCount, popularity };
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-semibold">c/{community.name}</h1>
					<div className="text-sm text-gray-600">{community.title}</div>
				</div>
				<form action={createPost} className="flex flex-col gap-2 w-full max-w-lg">
					<input name="title" placeholder="Post title" className="border rounded px-3 py-2" />
					<textarea name="content" placeholder="Post content" className="border rounded px-3 py-2 min-h-24" />
					<button className="px-3 py-2 rounded bg-black text-white self-start">Create</button>
				</form>
			</div>
			{community.description && <p className="text-sm">{community.description}</p>}
			<div className="flex items-center justify-end gap-2 text-sm">
				<Link href={`/c/${community.slug}?sort=recent`} className="px-2 py-1 border rounded">Recent</Link>
				<Link href={`/c/${community.slug}?sort=popular`} className="px-2 py-1 border rounded">Popular</Link>
				<Link href={`/c/${community.slug}?sort=views`} className="px-2 py-1 border rounded">Views</Link>
			</div>
			<ul className="space-y-3">
				{enriched.map((p) => (
					<li key={p.id} className="border rounded p-4">
						<Link href={`/post/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
						<div className="text-xs text-gray-600 mt-1">
							by {p.author.username} • Score {p.score} • {new Date(p.createdAt).toLocaleString()}
							{typeof p.viewCount === "number" && <> • Views {p.viewCount}</>}
							{typeof p.popularity === "number" && <> • Popular {p.popularity}</>}
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
