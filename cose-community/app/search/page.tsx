import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Search" };

type SortKey = "recent" | "oldest" | "alpha" | "score";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: SortKey; page?: string; t_users?: string; t_communities?: string; t_topics?: string; t_posts?: string }> }) {
  const { q, sort, page, t_users, t_communities, t_topics, t_posts } = await searchParams;
  const query = (q || "").trim();
  const selectedTypes = {
    users: t_users !== undefined || (t_users === undefined && t_communities === undefined && t_topics === undefined && t_posts === undefined),
    communities: t_communities !== undefined || (t_users === undefined && t_communities === undefined && t_topics === undefined && t_posts === undefined),
    topics: t_topics !== undefined || (t_users === undefined && t_communities === undefined && t_topics === undefined && t_posts === undefined),
    posts: t_posts !== undefined || (t_users === undefined && t_communities === undefined && t_topics === undefined && t_posts === undefined),
  };

  const orderUsers = sort === "alpha" ? { username: "asc" as const } : sort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };
  const orderCommunities = sort === "alpha" ? { name: "asc" as const } : sort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };
  const orderTopics = sort === "alpha" ? { title: "asc" as const } : sort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };
  const orderPosts = sort === "alpha" ? { title: "asc" as const } : sort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };

  const take = 20;
  const currentPage = Math.max(parseInt(page || "1", 10) || 1, 1);
  const skip = (currentPage - 1) * take;

  const [users, communities, topics, posts] = await Promise.all([
    query && selectedTypes.users ? prisma.user.findMany({ where: { OR: [{ username: { contains: query } }, { email: { contains: query } }] }, orderBy: orderUsers, skip, take, select: { username: true, email: true, createdAt: true } }) : Promise.resolve([]),
    query && selectedTypes.communities ? prisma.community.findMany({ where: { OR: [{ name: { contains: query } }, { title: { contains: query } }, { description: { contains: query } }] }, orderBy: orderCommunities, skip, take, select: { slug: true, name: true, title: true, createdAt: true } }) : Promise.resolve([]),
    query && selectedTypes.topics ? prisma.topic.findMany({ where: { OR: [{ title: { contains: query } }, { description: { contains: query } }] }, orderBy: orderTopics, skip, take, select: { id: true, title: true, createdAt: true, opinions: { select: { votes: { select: { value: true } } } } } }) : Promise.resolve([]),
    query && selectedTypes.posts ? prisma.post.findMany({ where: { OR: [{ title: { contains: query } }, { content: { contains: query } }] }, orderBy: orderPosts, skip, take, select: { id: true, title: true, createdAt: true, votes: { select: { value: true } } } }) : Promise.resolve([]),
  ]);

  // Optional score sorting (descending) in memory for posts and topics
  type PostWithVotes = { id: string; title: string; createdAt: Date; votes: { value: number }[] };
  const postsSorted: PostWithVotes[] = sort === "score" ? [...(posts as PostWithVotes[])].sort((a, b) => {
    const as = a.votes.reduce((acc, v) => acc + v.value, 0);
    const bs = b.votes.reduce((acc, v) => acc + v.value, 0);
    return bs - as;
  }) : posts;
  type TopicWithVotes = { id: string; title: string; createdAt: Date; opinions: { votes: { value: number }[] }[] };
  const topicsSorted: TopicWithVotes[] = sort === "score" ? [...(topics as TopicWithVotes[])].sort((a, b) => {
    const as = a.opinions.reduce((acc, o) => acc + o.votes.reduce((s, v) => s + v.value, 0), 0);
    const bs = b.opinions.reduce((acc, o) => acc + o.votes.reduce((s, v) => s + v.value, 0), 0);
    return bs - as;
  }) : topics;

  const hasMore = [users, communities, topics, posts].some(arr => arr.length === take);

  const makePageHref = (p: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort) params.set("sort", sort);
    if (selectedTypes.users) params.set("t_users", "1");
    if (selectedTypes.communities) params.set("t_communities", "1");
    if (selectedTypes.topics) params.set("t_topics", "1");
    if (selectedTypes.posts) params.set("t_posts", "1");
    params.set("page", String(p));
    return `/search?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Search</h1>
      <form action="/search" className="grid gap-3">
        <div className="flex gap-2">
          <input name="q" defaultValue={query} placeholder="Search users, communities, topics, posts" className="border rounded px-3 py-2 w-full" />
          <button className="px-3 py-2 rounded bg-black text-white">Search</button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1"><input type="checkbox" name="t_users" defaultChecked={selectedTypes.users} /> Users</label>
            <label className="flex items-center gap-1"><input type="checkbox" name="t_communities" defaultChecked={selectedTypes.communities} /> Communities</label>
            <label className="flex items-center gap-1"><input type="checkbox" name="t_topics" defaultChecked={selectedTypes.topics} /> Topics</label>
            <label className="flex items-center gap-1"><input type="checkbox" name="t_posts" defaultChecked={selectedTypes.posts} /> Posts</label>
          </div>
          <div className="flex items-center gap-2">
            <span>Sort:</span>
            <select name="sort" defaultValue={sort || "recent"} className="border rounded px-2 py-1">
              <option value="recent">Recent</option>
              <option value="oldest">Oldest</option>
              <option value="alpha">A-Z</option>
              <option value="score">Score</option>
            </select>
          </div>
        </div>
      </form>

      {query && (
        <div className="space-y-4">
          {selectedTypes.users && (
            <section>
              <h2 className="font-medium mb-1">Users</h2>
              {users.length ? (
                <ul className="list-disc ml-5">
                  {users.map((u) => (
                    <li key={u.username}><Link href={`/u/${u.username}`} className="underline">{u.username}</Link> <span className="text-xs text-gray-600">{u.email}</span></li>
                  ))}
                </ul>
              ) : <div className="text-sm text-gray-600">No users</div>}
            </section>
          )}

          {selectedTypes.communities && (
            <section>
              <h2 className="font-medium mb-1">Communities</h2>
              {communities.length ? (
                <ul className="list-disc ml-5">
                  {communities.map((c) => (
                    <li key={c.slug}><Link href={`/c/${c.slug}`} className="underline">{c.name}</Link> <span className="text-xs text-gray-600">{c.title}</span></li>
                  ))}
                </ul>
              ) : <div className="text-sm text-gray-600">No communities</div>}
            </section>
          )}

          {selectedTypes.topics && (
            <section>
              <h2 className="font-medium mb-1">Topics</h2>
              {topicsSorted.length ? (
                <ul className="list-disc ml-5">
                  {topicsSorted.map((t) => (
                    <li key={t.id}><Link href={`/debates/${t.id}`} className="underline">{t.title}</Link></li>
                  ))}
                </ul>
              ) : <div className="text-sm text-gray-600">No topics</div>}
            </section>
          )}

          {selectedTypes.posts && (
            <section>
              <h2 className="font-medium mb-1">Posts</h2>
              {postsSorted.length ? (
                <ul className="list-disc ml-5">
                  {postsSorted.map((p) => (
                    <li key={p.id}><Link href={`/post/${p.id}`} className="underline">{p.title}</Link></li>
                  ))}
                </ul>
              ) : <div className="text-sm text-gray-600">No posts</div>}
            </section>
          )}

          <div className="flex items-center justify-between mt-6">
            <a className={`px-3 py-1.5 border rounded ${currentPage <= 1 ? "pointer-events-none opacity-50" : ""}`} href={makePageHref(currentPage - 1)}>Prev</a>
            <span className="text-sm text-gray-600">Page {currentPage}</span>
            <a className={`px-3 py-1.5 border rounded ${!hasMore ? "pointer-events-none opacity-50" : ""}`} href={makePageHref(currentPage + 1)}>Next</a>
          </div>
        </div>
      )}
    </div>
  );
}


