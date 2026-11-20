"use client";

import { ChevronLeft, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { useSettingsHeading } from "./SettingsModalContext";

interface SettingsHeadingProps {
  description?: ReactNode;
  actions?: ReactNode;
}

/** Fuera de un `SettingsModal` no hay título: queda solo la descripción. */
export function SettingsHeading({
  description,
  actions,
}: SettingsHeadingProps) {
  const heading = useSettingsHeading();
  if (!heading && description == null && actions == null) return null;

  return (
    <div className="space-y-1.5">
      {heading ? (
        <div className="flex items-center gap-1">
          {heading.back ? (
            <button
              type="button"
              onClick={heading.back.onClick}
              aria-label={heading.back.label}
              className={cn(
                "text-content-muted hover:bg-surface-hover hover:text-content -ml-2 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors",
                heading.back.isMobileOnly && "sm:hidden",
              )}
            >
              <ChevronLeft size={20} />
            </button>
          ) : null}
          <h2
            id={heading.titleId}
            className="text-content font-display flex min-w-0 flex-1 items-center gap-1.5 text-xl font-bold"
          >
            <span className="truncate">{heading.title}</span>
          </h2>
          <SettingsCloseButton onClick={heading.onClose} />
        </div>
      ) : null}

      {description != null ? (
        <p className="text-content-muted text-sm leading-relaxed">
          {description}
        </p>
      ) : null}

      {actions != null ? (
        <div className="flex flex-wrap items-center gap-2 pt-3">{actions}</div>
      ) : null}
    </div>
  );
}

export function SettingsCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Cerrar"
      className="bg-surface-input text-content-subtle border-line hover:text-content flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors"
    >
      <X size={14} />
    </button>
  );
}
