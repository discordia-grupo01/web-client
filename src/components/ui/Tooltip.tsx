"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

interface TooltipProps {
  label: string;
  children: ReactNode;
  /** Ancho del hijo: por default se ajusta al contenido. */
  className?: string;
  align?: "center" | "end";
}

export function Tooltip({
  label,
  children,
  className,
  align = "center",
}: TooltipProps) {
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
          "bg-surface-raised border-line text-content pointer-events-none absolute top-full z-50",
          "mt-1.5 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-lg",
          align === "end" ? "right-0" : "left-1/2 -translate-x-1/2",
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

interface SideTooltipProps {
  label: string;
  children: ReactNode;
}

/**
 * Tooltip a la derecha del hijo, posicionado con `fixed` en un portal para que
 * no lo recorte un contenedor con scroll (p. ej. la barra de servidores).
 */
export function SideTooltip({ label, children }: SideTooltipProps) {
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(
    null,
  );

  const show = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setAnchor({ top: rect.top + rect.height / 2, left: rect.right + 8 });
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={(event) => show(event.currentTarget)}
      onMouseLeave={() => setAnchor(null)}
      onClickCapture={() => setAnchor(null)}
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) show(event.currentTarget);
      }}
      onBlur={() => setAnchor(null)}
    >
      {children}
      {anchor
        ? createPortal(
            <span
              role="tooltip"
              style={{ top: anchor.top, left: anchor.left }}
              className="bg-surface-raised border-line text-content pointer-events-none fixed z-50 -translate-y-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-lg"
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
