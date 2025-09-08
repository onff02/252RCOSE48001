import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function generateMetadata({ params }: { params: { id: string } }) {
	const post = await prisma.post.findUnique({ where: { id: params.id } });
	return { title: post ? post.title : "Post" };
}

export default async function PostPage({ params }: { params: { id: string } }) {
	const post = await prisma.post.findUnique({
		where: { id: params.id },
		select: {
			id: true,
			title: true,
			content: true,
			createdAt: true,
			community: { select: { slug: true, name: true } },
			author: { select: { username: true } },
			votes: { select: { value: true } },
		},
	});
	if (!post) return <div>Not found</div>;

	const comments = await prisma.comment.findMany({
		where: { postId: post.id },
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			content: true,
			createdAt: true,
			parentId: true,
			author: { select: { username: true } },
			votes: { select: { value: true } },
		},
	});

	async function addComment(formData: FormData) {
		"use server";
		const content = String(formData.get("content") || "");
		const user = await getCurrentUser();
		if (!user) return;
		await prisma.comment.create({ data: { content, authorId: user.id, postId: params.id } });
		revalidatePath(`/post/${params.id}`);
	}

	const score = post.votes.reduce((a, v) => a + v.value, 0);

	return (
		<div className="space-y-6">
			<div>
				<div className="text-xs text-gray-500 mb-1">c/{post.community.name} • by {post.author.username} • {new Date(post.createdAt).toLocaleString()}</div>
				<h1 className="text-xl font-semibold">{post.title}</h1>
				<div className="whitespace-pre-wrap mt-2">{post.content}</div>
				<div className="text-xs text-gray-600 mt-2">Score {score}</div>
			</div>
			<div>
				<h2 className="font-medium mb-2">Add a comment</h2>
				<form action={addComment} className="space-y-2">
					<textarea name="content" placeholder="Write a comment" className="w-full border rounded px-3 py-2" />
					<button className="px-3 py-2 rounded bg-black text-white">Comment</button>
				</form>
			</div>
			<div>
				<h2 className="font-medium mb-2">Comments</h2>
				<ul className="space-y-3">
					{comments.map((c) => {
						const cScore = c.votes.reduce((a, v) => a + v.value, 0);
						return (
							<li key={c.id} className="border rounded p-3">
								<div className="text-xs text-gray-500 mb-1">by {c.author.username} • {new Date(c.createdAt).toLocaleString()}</div>
								<div>{c.content}</div>
								<div className="text-xs text-gray-600 mt-1">Score {cScore}</div>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}
