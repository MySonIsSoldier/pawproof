"use client";

import { useState, type ReactNode } from "react";

/** Keeps photo interaction local while the page and image content render on the server. */
export function HeroPhotos({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="hero-art"
      data-expanded={expanded}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setExpanded(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setExpanded(false);
      }}
    >
      {children}
      <button
        type="button"
        className="hero-photo-toggle"
        aria-label="강아지 사진 펼침"
        aria-pressed={expanded}
        onClick={() => setExpanded((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setExpanded(false);
        }}
      >
        <span>{expanded ? "사진 접어보기 −" : "사진 펼쳐보기 +"}</span>
      </button>
    </div>
  );
}
