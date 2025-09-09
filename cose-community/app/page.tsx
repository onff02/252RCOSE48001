import Link from "next/link";
import { prisma } from "@/lib/db";
import { InfinitePosts } from "./components/InfinitePosts";

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
    take: 13,
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
  // Hot topics Top 5
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const hot = await prisma.topic.findMany({
    select: { id: true, title: true, opinions: { where: { createdAt: { gte: since } }, select: { id: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const hotRank = [...hot]
    .map((t) => ({ id: t.id, title: t.title, count: t.opinions.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
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

  const initial = finalList.slice(0, 12).map((p) => ({
    id: p.id,
    title: p.title,
    createdAt: p.createdAt.toISOString(),
    community: p.community,
    author: p.author,
    score: p.score,
  }));
  const nextCursor = finalList.length > 12 ? finalList[12].id : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Main Feed</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/?sort=recent" className="px-2 py-1 border rounded">Recent</Link>
          <Link href="/?sort=popular" className="px-2 py-1 border rounded">Popular</Link>
          <Link href="/?sort=views" className="px-2 py-1 border rounded">Views</Link>
        </div>
      </div>
      <div>
        <h2 className="font-medium mb-2">HOT Topics Top 5</h2>
        <ol className="list-decimal ml-5 space-y-1 text-sm">
          {hotRank.map((h) => (
            <li key={h.id}><Link href={`/debates/${h.id}`} className="underline">{h.title}</Link> <span className="text-xs text-gray-600">({h.count} opinions)</span></li>
          ))}
        </ol>
      </div>
      <h2 className="font-medium">Latest posts</h2>
      <InfinitePosts initialPosts={initial} initialNextCursor={nextCursor} />
    </div>
  );
}
