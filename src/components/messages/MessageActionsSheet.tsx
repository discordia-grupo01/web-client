"use client";

import {
  ADD_REACTION_LABEL,
  DELETE_MESSAGE_LABEL,
  EDIT_MESSAGE_LABEL,
  REPORT_MESSAGE_LABEL,
} from "@discordia/client-shared";

import { Flag, Pencil, Smile, Trash2, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { cn } from "@/lib/cn";

import { EmojiPickerSheet } from "./EmojiPickerSheet";

interface MessageActionsSheetProps {
  canEdit: boolean;
  canDelete: boolean;
  onReact?: (emoji: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport?: () => void;
  onClose: () => void;
}

export function MessageActionsSheet({
  canEdit,
  canDelete,
  onReact,
  onEdit,
  onDelete,
  onReport,
  onClose,
}: MessageActionsSheetProps) {
  const [isPickingEmoji, setIsPickingEmoji] = useState(false);

  if (isPickingEmoji && onReact) {
    return (
      <EmojiPickerSheet
        label={ADD_REACTION_LABEL}
        onPick={onReact}
        onClose={onClose}
      />
    );
  }

  return (
    <BottomSheet label="Acciones del mensaje" onClose={onClose}>
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
      {onReport ? (
        <SheetAction
          icon={Flag}
          label={REPORT_MESSAGE_LABEL}
          isDanger
          onClick={() => {
            onClose();
            onReport();
          }}
        />
      ) : null}

      <button
        type="button"
        onClick={onClose}
        className="bg-surface-input text-content-muted mt-2 w-full cursor-pointer rounded-xl py-3.5 text-sm font-bold"
      >
        Cancelar
      </button>
    </BottomSheet>
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
