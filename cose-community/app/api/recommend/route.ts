import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  if (!q) return NextResponse.json({ items: [] });
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=${encodeURIComponent(q)}&srlimit=5`;
    const res = await fetch(url, { headers: { "User-Agent": "COSE-Community/1.0" }, cache: "no-store" });
    const data: { query?: { search?: { title: string }[] } } = await res.json();
    const items = (data.query?.search || []).map((s) => {
      const title = s.title;
      const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s/g, "_"))}`;
      return { title, url: pageUrl };
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}


