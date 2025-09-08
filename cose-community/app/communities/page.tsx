import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Communities" };

export default async function CommunitiesPage() {
	const communities = await prisma.community.findMany({
		orderBy: { createdAt: "desc" },
		select: { id: true, name: true, slug: true, title: true, description: true },
	});
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Communities</h1>
				<Link href="/communities/create" className="px-3 py-1.5 rounded bg-black text-white">Create</Link>
			</div>
			<ul className="space-y-3">
				{communities.map((c) => (
					<li key={c.id} className="border rounded p-4">
						<Link href={`/c/${c.slug}`} className="font-medium hover:underline">{c.name}</Link>
						<div className="text-sm text-gray-600">{c.title}</div>
						{c.description && <p className="text-sm mt-1">{c.description}</p>}
					</li>
				))}
			</ul>
		</div>
	);
}


