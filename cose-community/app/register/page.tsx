import Link from "next/link";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Register" };

export default function RegisterPage() {
	async function register(formData: FormData) {
		"use server";
		const email = String(formData.get("email") || "");
		const username = String(formData.get("username") || "");
		const password = String(formData.get("password") || "");
		const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
		if (existing) return;
		const passwordHash = await hashPassword(password);
		const user = await prisma.user.create({ data: { email, username, passwordHash }, select: { id: true, username: true } });
		await createSessionCookie(user.id, user.username);
		redirect("/");
	}

	return (
		<div className="max-w-md mx-auto space-y-6">
			<h1 className="text-xl font-semibold">Register</h1>
			<form action={register} className="space-y-4">
				<input name="email" type="email" placeholder="Email" className="w-full border rounded px-3 py-2" />
				<input name="username" placeholder="Username" className="w-full border rounded px-3 py-2" />
				<input name="password" type="password" placeholder="Password" className="w-full border rounded px-3 py-2" />
				<button className="w-full bg-black text-white py-2 rounded">Create account</button>
			</form>
			<p className="text-sm">Already have an account? <Link href="/login" className="underline">Login</Link></p>
		</div>
	);
}
