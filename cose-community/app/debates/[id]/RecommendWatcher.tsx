"use client";
import { useEffect, useState } from "react";
import { RecommendClient } from "./RecommendClient";

export function RecommendWatcher({ targetId }: { targetId: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const el = document.getElementById(targetId) as HTMLTextAreaElement | null;
    if (!el) return;
    const handler = () => setText(el.value);
    el.addEventListener("input", handler);
    handler();
    return () => el.removeEventListener("input", handler);
  }, [targetId]);
  return <RecommendClient text={text} />;
}


