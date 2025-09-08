"use client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
	const router = useRouter();
	async function onClick() {
		await fetch("/api/auth/logout", { method: "POST" });
		router.refresh();
	}
	return (
		<button
			onClick={onClick}
			className="px-3 py-1.5 rounded border text-sm hover:bg-gray-100 dark:hover:bg-gray-900"
		>
			Logout
		</button>
	);
}


