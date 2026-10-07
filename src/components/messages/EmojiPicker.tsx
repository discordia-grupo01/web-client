"use client";

import type { LucideIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useFloatingPanel } from "@/hooks/useFloatingPanel";
import { cn } from "@/lib/cn";

const EmojiPickerPanel = dynamic(() => import("./EmojiPickerPanel"), {
  ssr: false,
});

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
              role="dialog"
              aria-label={label}
              className={cn(
                "fixed z-50 h-[435px] w-[352px]",
                !position && "invisible",
              )}
              style={{
                top: position?.top ?? -9999,
                left: position?.left,
                right: position?.right,
              }}
            >
              <EmojiPickerPanel
                onPick={(emoji) => {
                  onPick(emoji);
                  close();
                }}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
