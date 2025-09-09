import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
	const me = await getCurrentUser();
	if (!me) return <div>Please log in</div>;

	const notifications = await prisma.notification.findMany({
		where: { userId: me.id },
		orderBy: { createdAt: "desc" },
		select: { id: true, createdAt: true, type: true, message: true, url: true, seen: true },
		take: 100,
	});

	async function markSeen(formData: FormData) {
		"use server";
		const me = await getCurrentUser();
		if (!me) return;
		const id = String(formData.get("id") || "");
		if (!id) return;
		await prisma.notification.update({ where: { id }, data: { seen: true } });
		revalidatePath("/notifications");
	}

	async function markAllSeen() {
		"use server";
		const me = await getCurrentUser();
		if (!me) return;
		await prisma.notification.updateMany({ where: { userId: me.id, seen: false }, data: { seen: true } });
		revalidatePath("/notifications");
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Notifications</h1>
				<form action={markAllSeen}><button className="px-2 py-1 border rounded text-sm">Mark all as seen</button></form>
			</div>
			<ul className="space-y-2">
				{notifications.map((n) => (
					<li key={n.id} className={`border rounded p-3 ${!n.seen ? "bg-blue-50" : ""}`}>
						<div className="text-xs text-gray-600">{new Date(n.createdAt).toLocaleString()} • {n.type}</div>
						<div className="text-sm">{n.message} {n.url && (<a className="underline" href={n.url}>View</a>)}</div>
						{!n.seen && (
							<form action={markSeen} className="mt-1">
								<input type="hidden" name="id" value={n.id} />
								<button className="px-2 py-1 border rounded text-xs">Mark seen</button>
							</form>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
