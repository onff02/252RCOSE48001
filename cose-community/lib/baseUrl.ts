import { headers } from "next/headers";

export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const protocol = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}


