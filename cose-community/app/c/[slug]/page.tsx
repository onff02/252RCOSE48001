import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { moderateText } from "@/lib/moderation";

function getOrderClause(sort: string | null) {
  if (sort === "views") return { createdAt: "desc" as const };
  return { createdAt: "desc" as const };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const community = await prisma.community.findUnique({ where: { slug } });
	return { title: community ? community.name : "Community" };
}

export default async function CommunityPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ sort?: string }> }) {
	const { slug } = await params;
	const community = await prisma.community.findUnique({
		where: { slug },
		select: { id: true, name: true, slug: true, title: true, description: true },
	});
	if (!community) return <div>Not found</div>;
	const currentUser = await getCurrentUser();

	async function createPost(formData: FormData) {
		"use server";
		const title = String(formData.get("title") || "");
		const content = String(formData.get("content") || "");
		const user = await getCurrentUser();
		if (!user) return;
		const mod = moderateText(`${title}\n${content}`);
		if (mod.isSevere) return; // block severe content
		const community = await prisma.community.findUnique({ where: { slug } });
		if (!community) return;
		const created = await prisma.post.create({ data: { title, content, caution: mod.isCaution, authorId: user.id, communityId: community.id }, select: { id: true } });
		// Notify followers of author about new post
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const followers = await (prisma as any).follow.findMany({ where: { followingId: user.id }, select: { followerId: true } }).catch(() => [] as { followerId: string }[]);
		if (followers.length > 0) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await (prisma as any).notification.createMany({ data: followers.map((f: { followerId: string }) => ({ userId: f.followerId, actorId: user.id, type: "FOLLOWED_USER_ACTIVITY", message: `User you follow posted: ${title}`, url: `/post/${created.id}` })) });
		}
		revalidatePath(`/c/${slug}`);
	}

	async function createPoll(formData: FormData) {
		"use server";
		const me = await getCurrentUser();
		if (!me) return;
		const question = String(formData.get("question") || "").trim();
		const optionsRaw = String(formData.get("options") || "");
		if (!question) return;
		const optionLines = optionsRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
		const uniqueOptions = Array.from(new Set(optionLines));
		if (uniqueOptions.length < 2) return;
		const com = await prisma.community.findUnique({ where: { slug } });
		if (!com) return;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (prisma as any).poll.create({
			data: {
				question,
				creatorId: me.id,
				communityId: com.id,
				options: { create: uniqueOptions.map((text) => ({ text })) },
			},
		});
		revalidatePath(`/c/${slug}`);
	}

	async function votePoll(formData: FormData) {
		"use server";
		const me = await getCurrentUser();
		if (!me) return;
		const pollId = String(formData.get("pollId") || "");
		const optionId = String(formData.get("optionId") || "");
		if (!pollId || !optionId) return;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (prisma as any).pollVote.upsert({
			where: { userId_pollId: { userId: me.id, pollId } },
			update: { optionId },
			create: { userId: me.id, pollId, optionId },
		});
		revalidatePath(`/c/${slug}`);
	}

	const { sort } = await searchParams;
	const now = new Date();
	const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const isPopular = sort === "popular";
//	const isViews = sort === "views";

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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const polls: { id: string; question: string; options: { id: string; text: string; votes: { id: string; userId: string }[] }[] }[] = await (prisma as any).poll.findMany({
		where: { communityId: community.id },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			question: true,
			options: { select: { id: true, text: true, votes: { select: { id: true, userId: true } } } },
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
				<div className="flex items-center gap-2">
					<Link href={`/c/${community.slug}/create/post`} className="px-3 py-2 rounded bg-black text-white">Create post</Link>
					<Link href={`/c/${community.slug}/create/poll`} className="px-3 py-2 rounded border">Create poll</Link>
				</div>
			</div>
			{community.description && <p className="text-sm">{community.description}</p>}
            {/* Legacy inline poll creator removed in favor of dedicated page */}
			{polls.length > 0 && (
				<div>
					<h2 className="font-medium mb-2">Community Polls</h2>
					<ul className="space-y-3">
						{polls.map((p) => {
							const total = p.options.reduce((a, o) => a + o.votes.length, 0) || 0;
							return (
								<li key={p.id} className="border rounded p-3">
									<div className="font-medium mb-2">{p.question}</div>
									{currentUser ? (
										<form action={votePoll} className="space-y-2">
											<input type="hidden" name="pollId" value={p.id} />
											<div className="space-y-1">
												{p.options.map((o) => {
													const voted = !!(currentUser && o.votes.some((v) => v.userId === currentUser.id));
													return (
														<label key={o.id} className="flex items-center gap-2 text-sm">
															<input type="radio" name="optionId" value={o.id} defaultChecked={voted} /> {o.text}
														</label>
													);
												})}
											</div>
											<button className="px-2 py-1 border rounded text-sm">Vote</button>
										</form>
									) : null}
									<div className="mt-2 space-y-1">
										{p.options.map((o) => {
											const count = o.votes.length;
											const pct = total ? Math.round((count / total) * 100) : 0;
											return (
												<div key={o.id} className="text-xs">
													<div className="flex justify-between"><span>{o.text}</span><span>{count} ({pct}%)</span></div>
													<div className="h-2 bg-gray-200 rounded">
														<div className="h-2 bg-blue-500 rounded" style={{ width: `${pct}%` }} />
													</div>
												</div>
											);
										})}
										<div className="text-[10px] text-gray-600">Total votes: {total}</div>
									</div>
								</li>
							);
						})}
					</ul>
				</div>
			)}
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
							by <Link href={`/u/${p.author.username}`} className="underline">{p.author.username}</Link> • Score {p.score} • {new Date(p.createdAt).toLocaleString()}
							{typeof p.viewCount === "number" && <> • Views {p.viewCount}</>}
							{typeof p.popularity === "number" && <> • Popular {p.popularity}</>}
							{/* caution badge will be shown on post page where we have field */}
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
