import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function Home() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      createdAt: true,
      community: { select: { slug: true, name: true, title: true } },
      author: { select: { username: true } },
      votes: { select: { value: true } },
    },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Latest posts</h1>
      <ul className="space-y-4">
        {posts.map((p) => {
          const score = p.votes.reduce((a, v) => a + v.value, 0);
          return (
            <li key={p.id} className="border rounded p-4">
              <div className="text-xs text-gray-500 mb-1">
                <Link href={`/c/${p.community.slug}`} className="underline">{p.community.name}</Link>
                {" "}• posted by {p.author.username}
                {" "}• {new Date(p.createdAt).toLocaleString()}
              </div>
              <Link href={`/post/${p.id}`} className="text-lg font-medium hover:underline">
                {p.title}
              </Link>
              <div className="text-xs text-gray-600 mt-2">Score {score}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
