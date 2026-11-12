"use client";

import { type ReactNode, useState } from "react";

/** Texto tapado hasta que se lo toca. Una vez revelado queda a la vista. */
export function Spoiler({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return <span className="bg-surface-sunken rounded px-0.5">{children}</span>;
  }
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="Spoiler, tocá para verlo"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setRevealed(true);
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        setRevealed(true);
      }}
      className="bg-content-subtle hover:bg-content-muted cursor-pointer rounded px-0.5"
    >
      <span className="invisible">{children}</span>
    </span>
  );
}
