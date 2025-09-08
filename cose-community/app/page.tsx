import Link from "next/link";
import { prisma } from "@/lib/db";

function getOrderClause(sort: string | null) {
  if (sort === "views") return { createdAt: "desc" as const };
  return { createdAt: "desc" as const };
}

export default async function Home({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams;
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const isPopular = sort === "popular";
  const isViews = sort === "views";

  const posts = await prisma.post.findMany({
    orderBy: getOrderClause(sort || null),
    take: 20,
    select: {
      id: true,
      title: true,
      createdAt: true,
      community: { select: { slug: true, name: true, title: true } },
      author: { select: { username: true } },
      votes: isPopular ? { select: { value: true }, where: { createdAt: { gte: since24h } } } : { select: { value: true } },
      _count: { select: { views: true } },
    },
  });
  type Enriched = {
    id: string;
    title: string;
    createdAt: Date;
    community: { slug: string; name: string; title: string };
    author: { username: string };
    score: number;
    viewCount: number;
    popularity?: number;
  };

  const enriched: Enriched[] = posts.map((p) => {
    const scoreVotes = p.votes.reduce((a, v) => a + v.value, 0);
    const viewCount = p._count.views;
    const popularity = isPopular ? scoreVotes + viewCount : undefined;
    return {
      id: p.id,
      title: p.title,
      createdAt: p.createdAt,
      community: p.community,
      author: p.author,
      score: scoreVotes,
      viewCount,
      popularity,
    };
  });

  const finalList: Enriched[] = isViews
    ? [...enriched].sort((a, b) => b.viewCount - a.viewCount)
    : isPopular
    ? [...enriched].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    : enriched;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Posts</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/?sort=recent" className="px-2 py-1 border rounded">Recent</Link>
          <Link href="/?sort=popular" className="px-2 py-1 border rounded">Popular</Link>
          <Link href="/?sort=views" className="px-2 py-1 border rounded">Views</Link>
        </div>
      </div>
      <ul className="space-y-4">
        {finalList.map((p) => {
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
              <div className="text-xs text-gray-600 mt-2">
                Score {p.score}
                {typeof p.viewCount === "number" && <> • Views {p.viewCount}</>}
                {typeof p.popularity === "number" && <> • Popular {p.popularity}</>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
