import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { moderateText } from "@/lib/moderation";

export default async function CreateCommunityPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const me = await getCurrentUser();
  if (!me) return <div className="space-y-2"><div>Please log in</div><Link className="underline" href="/login">Login</Link></div>;
  const community = await prisma.community.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!community) return <div>Not found</div>;

  async function createPost(formData: FormData) {
    "use server";
    const me = await getCurrentUser();
    if (!me) return;
    const { slug } = await params;
    const comm = await prisma.community.findUnique({ where: { slug }, select: { id: true } });
    if (!comm) return;
    const title = String(formData.get("title") || "").trim();
    const content = String(formData.get("content") || "").trim();
    const mod = moderateText(`${title}\n${content}`);
    if (mod.isSevere || !title || !content) return;
    await prisma.post.create({ data: { title, content, caution: mod.isCaution, communityId: comm.id, authorId: me.id } });
    revalidatePath(`/c/${slug}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create post in c/{community.name}</h1>
      <form action={createPost} className="space-y-2 max-w-xl">
        <input name="title" placeholder="Title" className="w-full border rounded px-3 py-2" />
        <textarea name="content" placeholder="Content" className="w-full border rounded px-3 py-2 min-h-32" />
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded bg-black text-white">Create</button>
          <Link href={`/c/${slug}`} className="px-3 py-2 rounded border">Cancel</Link>
        </div>
      </form>
    </div>
  );
}


