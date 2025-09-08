import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Login" };

export default function LoginPage() {

	return (
		<div className="max-w-md mx-auto space-y-6">
			<h1 className="text-xl font-semibold">Login</h1>
			<LoginForm />
			<p className="text-sm">Don t have an account? <Link href="/register" className="underline">Register</Link></p>
		</div>
	);
}
