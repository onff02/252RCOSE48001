import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "My Profile" };

export default async function MePage() {
  const me = await getCurrentUser();
  if (!me) {
    redirect("/login");
  }

  async function changePassword(formData: FormData) {
    "use server";
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");

    const user = await prisma.user.findUnique({ where: { id: me!.id }, select: { id: true, passwordHash: true } });
    if (!user) return;
    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) return;
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: me!.id }, data: { passwordHash: newHash } });
    redirect("/me");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">My Profile</h1>
        <div className="text-sm text-gray-600">Username: {me.username}</div>
        <div className="text-sm text-gray-600">Email: {me.email}</div>
        <div className="text-sm text-gray-600">Joined: {new Date(me.createdAt).toLocaleDateString()}</div>
        <div className="text-sm mt-2">
          Public profile: <Link href={`/u/${me.username}`} className="underline">/u/{me.username}</Link>
        </div>
      </div>

      <div>
        <h2 className="font-medium mb-2">Change Password</h2>
        <form action={changePassword} className="space-y-3 max-w-sm">
          <input name="currentPassword" type="password" placeholder="Current password" className="w-full border rounded px-3 py-2" />
          <input name="newPassword" type="password" placeholder="New password" className="w-full border rounded px-3 py-2" />
          <button className="px-3 py-2 rounded bg-black text-white">Update Password</button>
        </form>
      </div>
    </div>
  );
}


