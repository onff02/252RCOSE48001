import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { OpinionComposer } from "./OpinionComposer";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await prisma.topic.findUnique({ where: { id } });
  return { title: topic ? topic.title : "Debate" };
}

type TreeNode = {
  id: string;
  content: string;
  side: "PRO" | "CON";
  createdAt: Date;
  author: { username: string };
  votes: { value: number; userId: string }[];
  children: TreeNode[];
};

type OpinionRow = {
  id: string;
  content: string;
  createdAt: Date;
  side: "PRO" | "CON";
  parentId: string | null;
  author: { username: string };
  votes: { value: number; userId: string }[];
};

function buildTree(opinions: OpinionRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  opinions.forEach((o) => {
    map.set(o.id, { id: o.id, content: o.content, side: o.side, createdAt: o.createdAt, author: o.author, votes: o.votes, children: [] });
  });
  opinions.forEach((o) => {
    if (o.parentId && map.has(o.parentId)) {
      map.get(o.parentId)!.children.push(map.get(o.id)!);
    } else {
      roots.push(map.get(o.id)!);
    }
  });
  return roots;
}

export default async function DebatePage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ sort?: string }> }) {
  const { id } = await params;
  const { sort } = await searchParams;
  const topic = await prisma.topic.findUnique({ where: { id }, select: { id: true, title: true, description: true } });
  if (!topic) return <div>Not found</div>;

  const opinions = await prisma.opinion.findMany({
    where: { topicId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      side: true,
      parentId: true,
      author: { select: { username: true } },
      votes: { select: { value: true, userId: true } },
    },
  });

  let tree = buildTree(opinions);

  // Sorting of root opinions
  function countLikes(votes: { value: number }[]): number { return votes.filter(v => v.value === 1).length; }
  function countDislikes(votes: { value: number }[]): number { return votes.filter(v => v.value === -1).length; }
  const isBest = sort === "best";
  const isControversial = sort === "controversial";
  const CONTROVERSIAL_THRESHOLD = 3;

  if (isBest) {
    tree = [...tree].sort((a, b) => {
      const as = a.votes.reduce((acc, v) => acc + v.value, 0);
      const bs = b.votes.reduce((acc, v) => acc + v.value, 0);
      return bs - as;
    });
  } else if (isControversial) {
    tree = [...tree].sort((a, b) => {
      const amin = Math.min(countLikes(a.votes), countDislikes(a.votes));
      const bmin = Math.min(countLikes(b.votes), countDislikes(b.votes));
      return bmin - amin;
    });
  }

  async function addOpinion(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) return;
    const content = String(formData.get("content") || "");
    const side = String(formData.get("side") || "PRO");
    const parentId = String(formData.get("parentId") || "");
    await prisma.opinion.create({ data: { content, side: side === "CON" ? "CON" : "PRO", authorId: user.id, topicId: id, parentId: parentId || null } });
    revalidatePath(`/debates/${id}`);
  }

  async function voteOpinion(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) return;
    const opinionId = String(formData.get("opinionId") || "");
    const valueStr = String(formData.get("value") || "");
    const desired = valueStr === "-1" ? -1 : 1;
    const existing = await prisma.opinionVote.findUnique({ where: { userId_opinionId: { userId: user.id, opinionId } } });
    if (existing && existing.value === desired) {
      await prisma.opinionVote.delete({ where: { userId_opinionId: { userId: user.id, opinionId } } });
    } else {
      await prisma.opinionVote.upsert({
        where: { userId_opinionId: { userId: user.id, opinionId } },
        update: { value: desired },
        create: { userId: user.id, opinionId, value: desired },
      });
    }
    revalidatePath(`/debates/${id}`);
  }

  function renderNode(node: TreeNode, depth = 0) {
    const score = node.votes.reduce((a, v) => a + v.value, 0);
    const likes = countLikes(node.votes);
    const dislikes = countDislikes(node.votes);
    const isRoot = depth === 0;
    const controversialBadge = Math.min(likes, dislikes) >= CONTROVERSIAL_THRESHOLD;
    return (
      <li key={node.id} className="border rounded p-3" style={{ marginLeft: depth * 16 }}>
        <div className="text-xs text-gray-500 mb-1">{node.side === "PRO" ? "Pro" : "Con"} • by {node.author.username} • {new Date(node.createdAt).toLocaleString()}</div>
        <div>{node.content}</div>
        <div className="flex items-center gap-2 mt-1 text-xs">
          <div className="text-gray-600">Score {score} • Likes {likes} • Dislikes {dislikes}</div>
          {isRoot && controversialBadge && (
            <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">Controversial</span>
          )}
          <form action={voteOpinion}>
            <input type="hidden" name="opinionId" value={node.id} />
            <input type="hidden" name="value" value="1" />
            <button className="px-2 py-1 border rounded">Like</button>
          </form>
          <form action={voteOpinion}>
            <input type="hidden" name="opinionId" value={node.id} />
            <input type="hidden" name="value" value="-1" />
            <button className="px-2 py-1 border rounded">Dislike</button>
          </form>
          <details>
            <summary className="cursor-pointer">Reply</summary>
            <form action={addOpinion} className="mt-2 space-y-2">
              <input type="hidden" name="parentId" value={node.id} />
              <textarea name="content" placeholder="Write a reply" className="w-full border rounded px-3 py-2" />
              <div className="flex gap-2 text-xs">
                <label><input type="radio" name="side" value="PRO" defaultChecked /> Pro</label>
                <label><input type="radio" name="side" value="CON" /> Con</label>
              </div>
              <button className="px-2 py-1 border rounded">Post reply</button>
            </form>
          </details>
        </div>
        {node.children.length > 0 && (
          <ul className="space-y-2 mt-2">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{topic.title}</h1>
        {topic.description && <p className="text-sm text-gray-700 mt-1">{topic.description}</p>}
      </div>
      <div>
        <h2 className="font-medium mb-2">Add an opinion</h2>
        <form action={addOpinion} className="space-y-2">
          <OpinionComposer />
          <div className="flex gap-2 text-sm">
            <label><input type="radio" name="side" value="PRO" defaultChecked /> Pro</label>
            <label><input type="radio" name="side" value="CON" /> Con</label>
          </div>
          <button className="px-3 py-2 rounded bg-black text-white">Post</button>
        </form>
      </div>
      <div>
        <h2 className="font-medium mb-2">Opinions</h2>
        <div className="flex items-center gap-2 text-sm mb-2">
          <a className="px-2 py-1 border rounded" href={`/debates/${topic.id}?sort=recent`}>Recent</a>
          <a className="px-2 py-1 border rounded" href={`/debates/${topic.id}?sort=best`}>Best</a>
          <a className="px-2 py-1 border rounded" href={`/debates/${topic.id}?sort=controversial`}>Controversial</a>
        </div>
        <ul className="space-y-2">
          {tree.map((n) => renderNode(n))}
        </ul>
      </div>
    </div>
  );
}


