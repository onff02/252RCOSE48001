import { prisma } from "@/lib/db";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Debates" };

export default async function DebatesPage() {
  const topics = await prisma.topic.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true, opinions: { select: { id: true } } },
  });

  async function createTopic(formData: FormData) {
    "use server";
    const user = await getCurrentUser();
    if (!user) return;
    const title = String(formData.get("title") || "");
    const description = String(formData.get("description") || "");
    await prisma.topic.create({ data: { title, description: description || null, creatorId: user.id } });
    revalidatePath("/debates");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Debates</h1>
      </div>
      <form action={createTopic} className="space-y-2 max-w-lg">
        <input name="title" placeholder="New topic title" className="w-full border rounded px-3 py-2" />
        <textarea name="description" placeholder="Description (optional)" className="w-full border rounded px-3 py-2 min-h-24" />
        <button className="px-3 py-2 rounded bg-black text-white">Create topic</button>
      </form>
      <ul className="space-y-3">
        {topics.map((t) => (
          <li key={t.id} className="border rounded p-4 flex items-center justify-between">
            <Link href={`/debates/${t.id}`} className="font-medium hover:underline">{t.title}</Link>
            <div className="text-xs text-gray-600">Opinions {t.opinions.length} • {new Date(t.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}


