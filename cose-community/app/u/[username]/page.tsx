import { prisma } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `${username} - Profile` };
}

export default async function UserProfile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, email: true, createdAt: true },
  });
  if (!user) return <div>User not found</div>;

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      votes: { select: { value: true } },
    },
  });

  const comments = await prisma.comment.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      votes: { select: { value: true } },
    },
  });

  const postLikes = posts.reduce((a, p) => a + p.votes.filter((v) => v.value === 1).length, 0);
  const postDislikes = posts.reduce((a, p) => a + p.votes.filter((v) => v.value === -1).length, 0);
  const commentLikes = comments.reduce((a, c) => a + c.votes.filter((v) => v.value === 1).length, 0);
  const commentDislikes = comments.reduce((a, c) => a + c.votes.filter((v) => v.value === -1).length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{user.username}</h1>
        <div className="text-sm text-gray-600">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
        <div className="text-sm mt-2">Total Likes {postLikes + commentLikes} • Total Dislikes {postDislikes + commentDislikes}</div>
      </div>

      <div>
        <h2 className="font-medium mb-2">Posts</h2>
        <ul className="space-y-2">
          {posts.map((p) => {
            const score = p.votes.reduce((a, v) => a + v.value, 0);
            return (
              <li key={p.id} className="border rounded p-3 flex items-center justify-between">
                <a href={`/post/${p.id}`} className="hover:underline">{p.title}</a>
                <div className="text-xs text-gray-600">Score {score} • {new Date(p.createdAt).toLocaleString()}</div>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2 className="font-medium mb-2">Comments</h2>
        <ul className="space-y-2">
          {comments.map((c) => {
            const score = c.votes.reduce((a, v) => a + v.value, 0);
            return (
              <li key={c.id} className="border rounded p-3">
                <div className="text-xs text-gray-500 mb-1">{new Date(c.createdAt).toLocaleString()}</div>
                <div className="text-sm">{c.content}</div>
                <div className="text-xs text-gray-600 mt-1">Score {score}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}


