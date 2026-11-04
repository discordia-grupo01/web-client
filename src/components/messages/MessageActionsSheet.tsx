"use client";

import {
  ADD_REACTION_LABEL,
  DELETE_MESSAGE_LABEL,
  EDIT_MESSAGE_LABEL,
} from "@discordia/client-shared";

import { Pencil, Smile, Trash2, type LucideIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";

const EmojiPickerPanel = dynamic(() => import("./EmojiPickerPanel"), {
  ssr: false,
});

interface MessageActionsSheetProps {
  canEdit: boolean;
  canDelete: boolean;
  onReact?: (emoji: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function MessageActionsSheet({
  canEdit,
  canDelete,
  onReact,
  onEdit,
  onDelete,
  onClose,
}: MessageActionsSheetProps) {
  const [isPickingEmoji, setIsPickingEmoji] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 transition-opacity duration-300 starting:opacity-0"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Acciones del mensaje"
        className="border-line-strong bg-surface-modal rounded-t-[22px] border-t px-4 pt-2.5 pb-7"
      >
        <div className="bg-line-strong mx-auto mb-4 h-1 w-9 rounded-xs" />

        {isPickingEmoji && onReact ? (
          <div className="flex justify-center">
            <EmojiPickerPanel
              perLine={8}
              onPick={(emoji) => {
                onReact(emoji);
                onClose();
              }}
            />
          </div>
        ) : (
          <>
            {onReact ? (
              <SheetAction
                icon={Smile}
                label={ADD_REACTION_LABEL}
                onClick={() => setIsPickingEmoji(true)}
              />
            ) : null}
            {canEdit ? (
              <SheetAction
                icon={Pencil}
                label={EDIT_MESSAGE_LABEL}
                onClick={() => {
                  onClose();
                  onEdit();
                }}
              />
            ) : null}
            {canDelete ? (
              <SheetAction
                icon={Trash2}
                label={DELETE_MESSAGE_LABEL}
                isDanger
                onClick={() => {
                  onClose();
                  onDelete();
                }}
              />
            ) : null}
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="bg-surface-input text-content-muted mt-2 w-full cursor-pointer rounded-xl py-3.5 text-sm font-bold"
        >
          Cancelar
        </button>
      </div>
    </div>,
    document.body,
  );
}

interface SheetActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isDanger?: boolean;
}

function SheetAction({
  icon: Icon,
  label,
  onClick,
  isDanger = false,
}: SheetActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="active:bg-surface-hover flex w-full cursor-pointer items-center gap-3.5 rounded-[14px] px-2 py-3 text-left"
    >
      <span
        className={cn(
          "flex size-9.5 items-center justify-center rounded-[11px]",
          isDanger ? "bg-danger/12 text-danger" : "bg-info/15 text-info",
        )}
      >
        <Icon size={16} />
      </span>
      <span
        className={cn(
          "text-[15px] font-bold",
          isDanger ? "text-danger" : "text-content",
        )}
      >
        {label}
      </span>
    </button>
  );
}
