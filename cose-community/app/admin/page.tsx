import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Admin" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const take = 20;
  const currentPage = Math.max(parseInt(page || "1", 10) || 1, 1);
  const skip = (currentPage - 1) * take;
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: me.id }, select: { role: true } });
  if (!user || user.role !== "ADMIN") redirect("/");

  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take,
    select: {
      id: true,
      createdAt: true,
      reason: true,
      status: true,
      reporter: { select: { username: true } },
      reportedUser: { select: { username: true } },
      post: { select: { id: true, title: true } },
      comment: { select: { id: true, content: true } },
      opinion: { select: { id: true, content: true } },
    },
  });
  const hasMore = reports.length === take;

  async function resolveReport(formData: FormData) {
    "use server";
    const me = await getCurrentUser();
    if (!me) return;
    const my = await prisma.user.findUnique({ where: { id: me.id }, select: { role: true } });
    if (!my || my.role !== "ADMIN") return;
    const id = String(formData.get("id") || "");
    await prisma.report.update({ where: { id }, data: { status: "RESOLVED", resolvedAt: new Date(), resolvedById: me.id } });
    revalidatePath("/admin");
  }

  async function banUser(formData: FormData) {
    "use server";
    const me = await getCurrentUser();
    if (!me) return;
    const my = await prisma.user.findUnique({ where: { id: me.id }, select: { role: true } });
    if (!my || my.role !== "ADMIN") return;
    const username = String(formData.get("username") || "");
    await prisma.user.update({ where: { username }, data: { banned: true } });
    revalidatePath("/admin");
  }

  async function unbanUser(formData: FormData) {
    "use server";
    const me = await getCurrentUser();
    if (!me) return;
    const my = await prisma.user.findUnique({ where: { id: me.id }, select: { role: true } });
    if (!my || my.role !== "ADMIN") return;
    const username = String(formData.get("username") || "");
    await prisma.user.update({ where: { username }, data: { banned: false } });
    revalidatePath("/admin");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Admin</h1>
      <div>
        <h2 className="font-medium mb-2">Banned users</h2>
        <ul className="space-y-2">
          {(await prisma.user.findMany({ where: { banned: true }, orderBy: { createdAt: "desc" }, take: 50, select: { username: true, email: true } })).map((u) => (
            <li key={u.username} className="flex items-center justify-between border rounded p-2">
              <div>
                {u.username} <span className="text-xs text-gray-600">{u.email}</span>
              </div>
              <form action={unbanUser}>
                <input type="hidden" name="username" value={u.username} />
                <button className="px-2 py-1 border rounded text-xs">Unban</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <h2 className="font-medium">Ban user</h2>
        <form action={banUser} className="flex items-center gap-2">
          <input name="username" placeholder="username" className="border rounded px-2 py-1" />
          <button className="px-2 py-1 border rounded">Ban</button>
        </form>
      </div>
      <div>
        <h2 className="font-medium mb-2">Reports</h2>
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="border rounded p-3">
              <div className="text-xs text-gray-600">{new Date(r.createdAt).toLocaleString()} • by {r.reporter.username} • status {r.status}</div>
              <div className="text-sm">Reason: {r.reason}</div>
              {r.post && <div className="text-sm">Post: <a href={`/post/${r.post.id}`} className="underline">{r.post.title}</a></div>}
              {r.comment && <div className="text-sm">Comment: {r.comment.content.slice(0, 80)}...</div>}
              {r.reportedUser && <div className="text-sm">Reported user: {r.reportedUser.username}</div>}
              {r.opinion && <div className="text-sm">Opinion: {r.opinion.content.slice(0, 120)}...</div>}
              {r.status === "OPEN" && (
                <form action={resolveReport} className="mt-2">
                  <input type="hidden" name="id" value={r.id} />
                  <button className="px-2 py-1 border rounded text-xs">Mark resolved</button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between mt-4">
          <a className={`px-2 py-1 border rounded ${currentPage <= 1 ? "pointer-events-none opacity-50" : ""}`} href={`/admin?page=${currentPage - 1}`}>Prev</a>
          <span className="text-sm text-gray-600">Page {currentPage}</span>
          <a className={`px-2 py-1 border rounded ${!hasMore ? "pointer-events-none opacity-50" : ""}`} href={`/admin?page=${currentPage + 1}`}>Next</a>
        </div>
      </div>
    </div>
  );
}


