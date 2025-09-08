import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: { id: string } }) {
	const post = await prisma.post.findUnique({ where: { id: params.id } });
	return { title: post ? post.title : "Post" };
}

export default async function PostPage({ params }: { params: { id: string } }) {
	const currentUser = await getCurrentUser();
	const post = await prisma.post.findUnique({
		where: { id: params.id },
		select: {
			id: true,
			title: true,
			content: true,
			createdAt: true,
			community: { select: { slug: true, name: true } },
			author: { select: { id: true, username: true } },
			votes: { select: { value: true, userId: true } },
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

	async function deletePost() {
		"use server";
		const user = await getCurrentUser();
		if (!user) return;
		const postRecord = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true, authorId: true, community: { select: { slug: true } } } });
		if (!postRecord) return;
		if (postRecord.authorId !== user.id) return;
		await prisma.$transaction([
			prisma.commentVote.deleteMany({ where: { comment: { postId: params.id } } }),
			prisma.comment.deleteMany({ where: { postId: params.id } }),
			prisma.postVote.deleteMany({ where: { postId: params.id } }),
			prisma.post.delete({ where: { id: params.id } }),
		]);
		revalidatePath(`/c/${postRecord.community.slug}`);
		redirect(`/c/${postRecord.community.slug}`);
	}

	async function upvote() {
		"use server";
		const user = await getCurrentUser();
		if (!user) return;
		const existing = await prisma.postVote.findUnique({ where: { userId_postId: { userId: user.id, postId: params.id } } });
		if (existing?.value === 1) {
			await prisma.postVote.delete({ where: { userId_postId: { userId: user.id, postId: params.id } } });
		} else {
			await prisma.postVote.upsert({
				where: { userId_postId: { userId: user.id, postId: params.id } },
				update: { value: 1 },
				create: { userId: user.id, postId: params.id, value: 1 },
			});
		}
		revalidatePath(`/post/${params.id}`);
	}

	const score = post.votes.reduce((a, v) => a + v.value, 0);
	const likedByMe = !!(currentUser && post.votes.some((v) => v.userId === currentUser.id && v.value === 1));

	return (
		<div className="space-y-6">
			<div>
				<div className="text-xs text-gray-500 mb-1">c/{post.community.name} • by {post.author.username} • {new Date(post.createdAt).toLocaleString()}</div>
				<h1 className="text-xl font-semibold">{post.title}</h1>
				<div className="whitespace-pre-wrap mt-2">{post.content}</div>
				<div className="flex items-center gap-3 mt-2">
					<div className="text-xs text-gray-600">Score {score}</div>
					<form action={upvote}>
						<button className={`px-2 py-1 rounded border text-xs ${likedByMe ? "bg-green-600 text-white border-green-600" : "hover:bg-gray-100 dark:hover:bg-gray-900"}`}>
							{likedByMe ? "Liked" : "Like"}
						</button>
					</form>
					{currentUser && currentUser.id === post.author.id && (
						<form action={deletePost}>
							<button className="px-2 py-1 rounded border text-xs text-red-600 hover:bg-red-50">Delete</button>
						</form>
					)}
				</div>
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
