import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PollBuilder } from "@/app/components/PollBuilder";

export default async function CreateCommunityPollPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const me = await getCurrentUser();
  if (!me) return <div className="space-y-2"><div>Please log in</div><Link className="underline" href="/login">Login</Link></div>;
  const community = await prisma.community.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!community) return <div>Not found</div>;

  async function createPoll(formData: FormData) {
    "use server";
    const me = await getCurrentUser();
    if (!me) return;
    const { slug } = await params;
    const comm = await prisma.community.findUnique({ where: { slug }, select: { id: true } });
    if (!comm) return;
    const question = String(formData.get("question") || "").trim();
    const optionsRaw = String(formData.get("options") || "");
    const optionLines = optionsRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const uniqueOptions = Array.from(new Set(optionLines));
    if (!question || uniqueOptions.length < 2) return;
    await prisma.poll.create({ data: { question, creatorId: me.id, communityId: comm.id, options: { create: uniqueOptions.map((text) => ({ text })) } } });
    revalidatePath(`/c/${slug}`);
    redirect(`/c/${slug}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create poll in c/{community.name}</h1>
      <form action={createPoll} className="space-y-3 max-w-xl">
        <input name="question" placeholder="Poll question" className="w-full border rounded px-3 py-2" />
        <PollBuilder />
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 rounded bg-black text-white">Create poll</button>
          <Link href={`/c/${slug}`} className="px-3 py-2 rounded border">Cancel</Link>
        </div>
      </form>
    </div>
  );
}


