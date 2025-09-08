export const metadata = { title: "Create community" };
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";

export default function CreateCommunityPage() {
	async function create(formData: FormData) {
		"use server";
		const name = String(formData.get("name") || "");
		const title = String(formData.get("title") || "");
		const description = String(formData.get("description") || "");
		const user = await getCurrentUser();
		if (!user) return;
		const slug = slugify(name);
		const exists = await prisma.community.findFirst({ where: { OR: [{ name }, { slug }] } });
		if (exists) return;
		await prisma.community.create({
			data: {
				name,
				slug,
				title,
				description: description || null,
				creatorId: user.id,
				memberships: { create: { userId: user.id, role: "OWNER" } },
			},
		});
		revalidatePath("/communities");
	}
	return (
		<div className="max-w-md mx-auto space-y-6">
			<h1 className="text-xl font-semibold">Create community</h1>
			<form action={create} className="space-y-4">
				<input name="name" placeholder="Name (e.g. typescript)" className="w-full border rounded px-3 py-2" />
				<input name="title" placeholder="Title" className="w-full border rounded px-3 py-2" />
				<textarea name="description" placeholder="Description" className="w-full border rounded px-3 py-2" />
				<button className="w-full bg-black text-white py-2 rounded">Create</button>
			</form>
		</div>
	);
}
