"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type PostCard = {
  id: string;
  title: string;
  createdAt: string;
  community: { slug: string; name: string; title?: string };
  author: { username: string };
  score?: number;
};

export function InfinitePosts({ initialPosts, initialNextCursor }: { initialPosts: PostCard[]; initialNextCursor: string | null }) {
  const [posts, setPosts] = useState<PostCard[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && cursor && !loading) {
        setLoading(true);
        try {
          const res = await fetch(`/api/posts?take=12&cursor=${encodeURIComponent(cursor)}`, { cache: "no-store" });
          const data: { posts?: PostCard[]; nextCursor?: string | null } = await res.json();
          const next = (data.posts || []).map((p) => ({
            id: p.id,
            title: p.title,
            createdAt: p.createdAt,
            community: p.community,
            author: p.author,
            score: p.score,
          }));
          setPosts((prev) => [...prev, ...next]);
          setCursor(data.nextCursor || null);
        } finally {
          setLoading(false);
        }
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loading]);

  return (
    <>
      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id} className="border rounded p-4">
            <div className="text-xs text-gray-500 mb-1">
              <Link href={`/c/${p.community.slug}`} className="underline">{p.community.name}</Link>
              {" "}• posted by <Link href={`/u/${p.author.username}`} className="underline">{p.author.username}</Link>
              {" "}• {new Date(p.createdAt).toLocaleString()}
            </div>
            <Link href={`/post/${p.id}`} className="text-lg font-medium hover:underline">{p.title}</Link>
            {typeof p.score === "number" && (
              <div className="text-xs text-gray-600 mt-2">Score {p.score}</div>
            )}
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} className="h-10" />
      {loading && <div className="text-center text-sm text-gray-600 py-2">Loading…</div>}
      {!cursor && <div className="text-center text-xs text-gray-500 py-2">No more posts</div>}
    </>
  );
}


