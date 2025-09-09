"use client";
import { useEffect, useState } from "react";

export function RecommendClient({ text }: { text: string }) {
  const [items, setItems] = useState<{ title: string; url: string }[]>([]);
  useEffect(() => {
    let active = true;
    const q = text.trim();
    if (!q) { setItems([]); return; }
    const controller = new AbortController();
    fetch(`/api/recommend?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then(r => r.json())
      .then((d) => { if (active) setItems(d.items || []); })
      .catch(() => {});
    return () => { active = false; controller.abort(); };
  }, [text]);

  if (!items.length) return null;
  return (
    <div className="mt-2 border rounded p-2 bg-gray-50 text-sm">
      <div className="font-medium mb-1">Recommended sources</div>
      <ul className="list-disc ml-5 space-y-1">
        {items.map((it) => (
          <li key={it.url}><a href={it.url} target="_blank" rel="noreferrer" className="underline">{it.title}</a></li>
        ))}
      </ul>
    </div>
  );
}


