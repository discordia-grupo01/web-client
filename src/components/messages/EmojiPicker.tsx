"use client";

import type { LucideIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useFloatingPanel } from "@/hooks/useFloatingPanel";
import { cn } from "@/lib/cn";

import { EmojiPickerPremiumNote } from "./EmojiPickerPremiumNote";
import { EmojiPickerSheet } from "./EmojiPickerSheet";
import type { CustomEmojiCategory } from "./hooks/useCustomEmojiPicker";

const EmojiPickerPanel = dynamic(() => import("./EmojiPickerPanel"), {
  ssr: false,
});

interface EmojiPickerProps {
  icon: LucideIcon;
  label: string;
  onPick: (emoji: string) => void;
  /** Un emoji del servidor, por id. Sin esto no se muestran categorías propias. */
  onPickCustom?: (id: string) => void;
  custom?: CustomEmojiCategory[];
  lockedTooltips?: string[];
  lockedCategoryIds?: string[];
  /** Hay emojis que esta persona no puede usar: se ofrece Premium al pie. */
  showsPremiumNote?: boolean;
  onOpenPremium?: () => void;
  /** Avisa al abrir para cargar los emojis del servidor recién ahí. */
  onOpenChange?: (isOpen: boolean) => void;
  iconSize?: number;
  align?: "left" | "right";
  triggerClassName?: string;
}

export function EmojiPicker({
  icon: Icon,
  label,
  onPick,
  onPickCustom,
  custom,
  lockedTooltips,
  lockedCategoryIds,
  showsPremiumNote = false,
  onOpenPremium,
  onOpenChange,
  iconSize = 16,
  align = "right",
  triggerClassName,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSheet, setIsSheet] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const close = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };
  const { panelRef, position } = useFloatingPanel({
    enabled: !isSheet,
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
        onClick={() => {
          setIsSheet(window.matchMedia("(pointer: coarse)").matches);
          setIsOpen((prev) => {
            onOpenChange?.(!prev);
            return !prev;
          });
        }}
        className={cn("cursor-pointer transition-colors", triggerClassName)}
      >
        <Icon size={iconSize} />
      </button>

      {isOpen && isSheet ? (
        <EmojiPickerSheet
          label={label}
          onPick={onPick}
          onPickCustom={onPickCustom}
          custom={custom}
          lockedTooltips={lockedTooltips}
          lockedCategoryIds={lockedCategoryIds}
          showsPremiumNote={showsPremiumNote}
          onOpenPremium={onOpenPremium}
          onClose={close}
        />
      ) : null}

      {isOpen && !isSheet && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={label}
              className={cn("fixed z-50 w-[352px]", !position && "invisible")}
              style={{
                top: position?.top ?? -9999,
                left: position?.left,
                right: position?.right,
              }}
            >
              <EmojiPickerPanel
                custom={custom}
                lockedTooltips={lockedTooltips}
                lockedCategoryIds={lockedCategoryIds}
                onPick={(emoji) => {
                  onPick(emoji);
                  close();
                }}
                onPickCustom={
                  onPickCustom &&
                  ((id) => {
                    onPickCustom(id);
                    close();
                  })
                }
              />
              {showsPremiumNote && onOpenPremium ? (
                <EmojiPickerPremiumNote
                  onOpenPremium={() => {
                    // Primero se cierra: Premium abre la configuración, que
                    // quedaría tapada por el selector.
                    close();
                    onOpenPremium();
                  }}
                />
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
