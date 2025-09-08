import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export async function generateMetadata({ params }: { params: { slug: string } }) {
	const community = await prisma.community.findUnique({ where: { slug: params.slug } });
	return { title: community ? community.name : "Community" };
}

export default async function CommunityPage({ params }: { params: { slug: string } }) {
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

	const posts = await prisma.post.findMany({
		where: { communityId: community.id },
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			title: true,
			createdAt: true,
			author: { select: { username: true } },
			votes: { select: { value: true } },
		},
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
			<ul className="space-y-3">
				{posts.map((p) => {
					const score = p.votes.reduce((a, v) => a + v.value, 0);
					return (
						<li key={p.id} className="border rounded p-4">
							<Link href={`/post/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
							<div className="text-xs text-gray-600 mt-1">by {p.author.username} • Score {score} • {new Date(p.createdAt).toLocaleString()}</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
