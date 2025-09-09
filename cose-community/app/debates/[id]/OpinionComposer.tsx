"use client";
import { useEffect, useState } from "react";
import { RecommendClient } from "./RecommendClient";

export function OpinionComposer() {
  const [text, setText] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 400);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <div>
      <textarea
        name="content"
        placeholder="Write your opinion"
        className="w-full border rounded px-3 py-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <RecommendClient text={debounced} />
    </div>
  );
}


