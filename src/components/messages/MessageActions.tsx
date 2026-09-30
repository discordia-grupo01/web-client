"use client";

import {
  ADD_REACTION_LABEL,
  DELETE_MESSAGE_LABEL,
  EDIT_MESSAGE_LABEL,
} from "@discordia/client-shared";

import { Pencil, SmilePlus, Trash2 } from "lucide-react";

import { cn } from "@/lib/cn";

import { EmojiPicker } from "./EmojiPicker";

interface MessageActionsProps {
  canEdit: boolean;
  canDelete: boolean;
  onToggleReaction?: (emoji: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ACTION_BUTTON =
  "text-content-subtle hover:text-content flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors";

/** Barra flotante de acciones sobre un mensaje: reaccionar, editar, eliminar. */
export function MessageActions({
  canEdit,
  canDelete,
  onToggleReaction,
  onEdit,
  onDelete,
}: MessageActionsProps) {
  if (!onToggleReaction && !canEdit && !canDelete) return null;

  return (
    <div className="bg-surface-raised border-line absolute -top-3 right-2 flex rounded-lg border opacity-0 shadow-md transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100">
      {onToggleReaction ? (
        <EmojiPicker
          icon={SmilePlus}
          label={ADD_REACTION_LABEL}
          onPick={onToggleReaction}
          triggerClassName={ACTION_BUTTON}
        />
      ) : null}
      {canEdit ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={EDIT_MESSAGE_LABEL}
          title={EDIT_MESSAGE_LABEL}
          className={cn(ACTION_BUTTON, "hover:text-accent-strong")}
        >
          <Pencil size={14} />
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label={DELETE_MESSAGE_LABEL}
          title={DELETE_MESSAGE_LABEL}
          className={cn(ACTION_BUTTON, "hover:text-danger")}
        >
          <Trash2 size={14} />
        </button>
      ) : null}
    </div>
  );
}
