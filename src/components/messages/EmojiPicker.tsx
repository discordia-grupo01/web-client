"use client";

import { QUICK_REACTIONS } from "@discordia/client-shared";

import type { LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useFloatingPanel } from "@/hooks/useFloatingPanel";
import { cn } from "@/lib/cn";

interface EmojiPickerProps {
  icon: LucideIcon;
  label: string;
  onPick: (emoji: string) => void;
  iconSize?: number;
  align?: "left" | "right";
  triggerClassName?: string;
}

export function EmojiPicker({
  icon: Icon,
  label,
  onPick,
  iconSize = 16,
  align = "right",
  triggerClassName,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const close = () => setIsOpen(false);
  const { panelRef, position } = useFloatingPanel({
    enabled: true,
    isOpen,
    onClose: close,
    anchorRef,
    align,
  });

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn("cursor-pointer transition-colors", triggerClassName)}
      >
        <Icon size={iconSize} />
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="menu"
              className={cn(
                "bg-surface-raised border-line-strong fixed z-50 flex gap-0.5 rounded-xl border p-1 shadow-2xl",
                !position && "invisible",
              )}
              style={{
                top: position?.top ?? -9999,
                left: position?.left,
                right: position?.right,
              }}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onPick(emoji);
                    close();
                  }}
                  className="hover:bg-surface-hover flex size-9 cursor-pointer items-center justify-center rounded-lg text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
