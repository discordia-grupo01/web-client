"use client";

import {
  formatMessageTime,
  MESSAGE_EDITED_LABEL,
  type MessageAuthor,
  type MessageReaction,
  type MentionResolver,
} from "@discordia/client-shared";

import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

import { MessageActions } from "./MessageActions";
import { MessageContent } from "./MessageContent";
import { DeleteMessageModal } from "./DeleteMessageModal";
import { MessageEditForm } from "./MessageEditForm";
import { MessageHeader } from "./MessageHeader";
import { MessageReactions } from "./MessageReactions";

const AVATAR_SIZE = 38;

/** Forma minima que necesita esta fila: sirve tanto para `Message` (canal) como para `DmMessage`. */
export interface MessageItemMessage {
  id: string;
  user_id: string;
  content: string;
  inserted_at: string;
  edited_at?: string | null;
  reactions?: MessageReaction[];
}

/** `void` en los mensajes directos (maqueta local, no puede fallar). */
export type MessageEditOutcome = { ok: true } | { ok: false; message: string };

interface MessageItemProps {
  message: MessageItemMessage;
  author: MessageAuthor;
  isGroupStart: boolean;
  canEdit: boolean;
  canDelete: boolean;
  resolveMention?: MentionResolver;
  onToggleReaction?: (emoji: string) => void;
  onEdit: (content: string) => void | Promise<MessageEditOutcome>;
  onDelete: () => void;
}

export function MessageItem({
  message,
  author,
  isGroupStart,
  canEdit,
  canDelete,
  resolveMention,
  onToggleReaction,
  onEdit,
  onDelete,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  async function saveEdit(content: string) {
    if (content === message.content) return stopEditing();
    setIsSavingEdit(true);
    const result = await onEdit(content);
    setIsSavingEdit(false);
    if (result && !result.ok) return setEditError(result.message);
    stopEditing();
  }

  function stopEditing() {
    setIsEditing(false);
    setEditError(null);
  }

  return (
    <article
      tabIndex={0}
      className={cn(
        "group/message hover:bg-surface-hover focus-visible:bg-surface-hover has-[:focus-visible]:bg-surface-hover relative flex gap-3 rounded-md px-2 py-0.5 outline-none",
        isGroupStart && "mt-4",
      )}
    >
      {isGroupStart ? (
        <Avatar
          name={author.name}
          src={author.avatarUrl}
          size={AVATAR_SIZE}
          className="mt-0.5 rounded-full"
        />
      ) : (
        <time
          dateTime={message.inserted_at}
          className="text-content-subtle w-[38px] shrink-0 pt-1 text-center text-[10px] opacity-0 group-hover/message:opacity-100"
        >
          {formatMessageTime(message.inserted_at)}
        </time>
      )}

      <div className="min-w-0 flex-1">
        {isGroupStart ? (
          <MessageHeader author={author} createdAt={message.inserted_at} />
        ) : null}

        {isEditing ? (
          <MessageEditForm
            initialContent={message.content}
            onSave={saveEdit}
            onCancel={stopEditing}
            isSaving={isSavingEdit}
            error={editError}
          />
        ) : (
          <MessageContent
            content={message.content}
            resolveMention={resolveMention}
            suffix={
              message.edited_at ? (
                <span className="text-content-subtle ml-1 text-[10px]">
                  {MESSAGE_EDITED_LABEL}
                </span>
              ) : null
            }
          />
        )}

        {!isEditing && onToggleReaction ? (
          <MessageReactions
            reactions={message.reactions ?? []}
            onToggle={onToggleReaction}
          />
        ) : null}
      </div>

      {!isEditing ? (
        <MessageActions
          canEdit={canEdit}
          canDelete={canDelete}
          onToggleReaction={onToggleReaction}
          onEdit={() => setIsEditing(true)}
          onDelete={() => setIsConfirmingDelete(true)}
        />
      ) : null}

      {isConfirmingDelete ? (
        <DeleteMessageModal
          message={message}
          author={author}
          resolveMention={resolveMention}
          onConfirm={() => {
            setIsConfirmingDelete(false);
            onDelete();
          }}
          onCancel={() => setIsConfirmingDelete(false)}
        />
      ) : null}
    </article>
  );
}
