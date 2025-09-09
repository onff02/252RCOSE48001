import { prisma } from "@/lib/db";
import type { TopicCategory } from "@prisma/client";
import Link from "next/link";

export const metadata = { title: "Debates" };

export default async function DebatesPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const category: TopicCategory | undefined =
    cat === "INTERNATIONAL" ? "INTERNATIONAL" : cat === "ECONOMY" ? "ECONOMY" : cat === "DOMESTIC" ? "DOMESTIC" : undefined;

  const topics = await prisma.topic.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true, category: true, opinions: { select: { id: true } } },
  });

  // Hot ranking: top 5 by opinions in last 48h
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const hot: { id: string; title: string; opinions: { id: string }[] }[] = await prisma.topic.findMany({
    where: category ? { category } : undefined,
    select: { id: true, title: true, opinions: { where: { createdAt: { gte: since } }, select: { id: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const hotRank = [...hot]
    .map((t) => ({ id: t.id, title: t.title, count: t.opinions.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Debates</h1>
      </div>
      {/* Topic creation moved to Admin page */}
      <div className="flex items-center gap-2 text-sm">
        <span>Filter:</span>
        <Link className="px-2 py-1 border rounded" href="/debates">All</Link>
        <Link className="px-2 py-1 border rounded" href="/debates?cat=DOMESTIC">Domestic</Link>
        <Link className="px-2 py-1 border rounded" href="/debates?cat=INTERNATIONAL">International</Link>
        <Link className="px-2 py-1 border rounded" href="/debates?cat=ECONOMY">Economy/Real Estate</Link>
      </div>
      <div>
        <h2 className="font-medium mb-2">HOT Topics Top 5</h2>
        <ol className="list-decimal ml-5 space-y-1 text-sm">
          {hotRank.map((h) => (
            <li key={h.id}><Link href={`/debates/${h.id}`} className="underline">{h.title}</Link> <span className="text-xs text-gray-600">({h.count} opinions)</span></li>
          ))}
        </ol>
      </div>
      <ul className="space-y-3">
        {topics.map((t) => (
          <li key={t.id} className="border rounded p-4">
            <div className="flex items-center justify-between">
              <Link href={`/debates/${t.id}`} className="font-medium hover:underline">{t.title}</Link>
              <span className="text-xs border rounded px-2 py-0.5">{t.category}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">Opinions {t.opinions.length} • {new Date(t.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}


