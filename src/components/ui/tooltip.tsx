"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface TooltipProps {
  label: string;
  children: ReactNode;
  /** Ancho del hijo: por default se ajusta al contenido. */
  className?: string;
}

export function Tooltip({ label, children, className }: TooltipProps) {
  const [isSuppressed, setIsSuppressed] = useState(false);

  return (
    <span
      className={cn("group relative inline-flex", className)}
      onClickCapture={() => setIsSuppressed(true)}
      onMouseMove={() => {
        if (isSuppressed) setIsSuppressed(false);
      }}
      onMouseLeave={() => setIsSuppressed(false)}
    >
      {children}

      <span
        role="tooltip"
        className={cn(
          "bg-surface-raised border-line text-content pointer-events-none absolute top-full left-1/2 z-50",
          "mt-1.5 -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-lg",
          "opacity-0 transition-opacity",
          !isSuppressed &&
            "group-hover:opacity-100 group-has-[:focus-visible]:opacity-100",
        )}
      >
        {label}
      </span>
    </span>
  );
}
