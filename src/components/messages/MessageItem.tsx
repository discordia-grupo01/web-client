"use client";

import {
  formatMessageTime,
  MESSAGE_EDITED_LABEL,
  type MessageAuthor,
  type MessageReaction,
} from "@discordia/client-shared";

import { useState } from "react";

import { ServerAvatar } from "@/components/ui/server-avatar";
import { cn } from "@/lib/cn";

import { MessageActions } from "./MessageActions";
import { MessageContent, type MentionResolver } from "./MessageContent";
import { MessageDeletedNotice } from "./MessageDeletedNotice";
import { MessageEditForm } from "./MessageEditForm";
import { MessageHeader } from "./MessageHeader";
import { MessageReactions } from "./MessageReactions";

const AVATAR_SIZE = 38;

/** Forma minima que necesita esta fila: sirve tanto para `Message` (canal) como para `DmMessage`. */
export interface MessageItemMessage {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  reactions?: MessageReaction[];
}

interface MessageItemProps {
  message: MessageItemMessage;
  author: MessageAuthor;
  isGroupStart: boolean;
  canEdit: boolean;
  canDelete: boolean;
  resolveMention?: MentionResolver;
  onToggleReaction?: (emoji: string) => void;
  onEdit: (content: string) => void;
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
  const isDeleted = message.deleted_at !== null;

  function saveEdit(content: string) {
    onEdit(content);
    setIsEditing(false);
  }

  return (
    <article
      tabIndex={0}
      className={cn(
        "group/message hover:bg-surface-hover focus-within:bg-surface-hover relative flex gap-3 rounded-md px-2 py-0.5 outline-none",
        isGroupStart && "mt-4",
      )}
    >
      {isGroupStart ? (
        <ServerAvatar
          name={author.name}
          src={author.avatarUrl}
          size={AVATAR_SIZE}
          className="mt-0.5 rounded-full"
        />
      ) : (
        <time
          dateTime={message.created_at}
          className="text-content-subtle w-[38px] shrink-0 pt-1 text-center text-[10px] opacity-0 group-hover/message:opacity-100"
        >
          {formatMessageTime(message.created_at)}
        </time>
      )}

      <div className="min-w-0 flex-1">
        {isGroupStart ? (
          <MessageHeader author={author} createdAt={message.created_at} />
        ) : null}

        {isDeleted ? (
          <MessageDeletedNotice />
        ) : isEditing ? (
          <MessageEditForm
            initialContent={message.content}
            onSave={saveEdit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <>
            <MessageContent
              content={message.content}
              resolveMention={resolveMention}
            />
            {message.edited_at ? (
              <span className="text-content-subtle ml-1 text-[10px]">
                {MESSAGE_EDITED_LABEL}
              </span>
            ) : null}
          </>
        )}

        {!isDeleted && !isEditing && message.reactions && onToggleReaction ? (
          <MessageReactions
            reactions={message.reactions}
            onToggle={onToggleReaction}
          />
        ) : null}
      </div>

      {!isDeleted && !isEditing ? (
        <MessageActions
          canEdit={canEdit}
          canDelete={canDelete}
          onToggleReaction={message.reactions ? onToggleReaction : undefined}
          onEdit={() => setIsEditing(true)}
          onDelete={onDelete}
        />
      ) : null}
    </article>
  );
}
