"use client";

import {
  ADD_REACTION_LABEL,
  DELETE_MESSAGE_LABEL,
  EDIT_MESSAGE_LABEL,
  QUICK_REACTIONS,
  REPORT_MESSAGE_LABEL,
} from "@discordia/client-shared";

import { Flag, Pencil, SmilePlus, Trash2 } from "lucide-react";

import { cn } from "@/lib/cn";

import { EmojiPicker } from "./EmojiPicker";

interface MessageActionsProps {
  canEdit: boolean;
  canDelete: boolean;
  onToggleReaction?: (emoji: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport?: () => void;
}

const BAR_REACTIONS = QUICK_REACTIONS.slice(0, 3);

const ACTION_BUTTON =
  "text-content-subtle hover:text-content flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors";

export function MessageActions({
  canEdit,
  canDelete,
  onToggleReaction,
  onEdit,
  onDelete,
  onReport,
}: MessageActionsProps) {
  if (!onToggleReaction && !canEdit && !canDelete && !onReport) return null;

  return (
    <div className="bg-surface-raised border-line absolute -top-3 right-2 flex rounded-lg border opacity-0 shadow-md transition-opacity group-hover/message:opacity-100 group-focus-visible/message:opacity-100 group-has-[:focus-visible]/message:opacity-100 has-[[aria-expanded=true]]:opacity-100 pointer-coarse:hidden">
      {onToggleReaction
        ? BAR_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onToggleReaction(emoji)}
              aria-label={emoji}
              className="hover:bg-surface-hover flex size-8 cursor-pointer items-center justify-center rounded-lg text-lg transition-colors"
            >
              {emoji}
            </button>
          ))
        : null}
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
      {onReport ? (
        <button
          type="button"
          onClick={onReport}
          aria-label={REPORT_MESSAGE_LABEL}
          title={REPORT_MESSAGE_LABEL}
          className={cn(ACTION_BUTTON, "hover:text-danger")}
        >
          <Flag size={14} />
        </button>
      ) : null}
    </div>
  );
}
