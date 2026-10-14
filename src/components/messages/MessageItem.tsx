"use client";

import {
  formatMessageTime,
  MESSAGE_EDITED_LABEL,
  MESSAGE_NOT_SENT_LABEL,
  mentionsPerson,
  type MessageAttachment,
  type MessageAuthor,
  type MessageMentions,
  type MessageReaction,
} from "@discordia/client-shared";

import { CircleAlert } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

import { MessageAttachments } from "./MessageAttachments";
import { MessageActions } from "./MessageActions";
import { useMessageMentions } from "./MentionsContext";
import { MessageContent } from "./MessageContent";
import { DeleteMessageModal } from "./DeleteMessageModal";
import { MessageEditForm } from "./MessageEditForm";
import { MessageHeader } from "./MessageHeader";
import { MessageReactions } from "./MessageReactions";

const AVATAR_SIZE = 38;

/** Forma minima que necesita esta fila: sirve tanto para `Message` (canal) como para `DmMessage`. */
export interface MessageItemMessage extends MessageMentions {
  id: string;
  user_id: string;
  content: string;
  inserted_at: string;
  edited_at?: string | null;
  reactions?: MessageReaction[];
  attachments?: MessageAttachment[];
  /** Mensaje propio que no se pudo enviar (solo existe en pantalla). */
  delivery?: "failed";
  delivery_error?: string;
}

/** `void` en los mensajes directos (maqueta local, no puede fallar). */
export type MessageEditOutcome = { ok: true } | { ok: false; message: string };

interface MessageItemProps {
  message: MessageItemMessage;
  author: MessageAuthor;
  isGroupStart: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onToggleReaction?: (emoji: string) => void;
  /** `false` sin `ADD_REACTIONS`: no se ofrece reaccionar, solo sacar la propia. */
  canAddReactions?: boolean;
  onEdit: (content: string) => void | Promise<MessageEditOutcome>;
  onDelete: () => void;
}

export function MessageItem({
  message,
  author,
  isGroupStart,
  canEdit,
  canDelete,
  onToggleReaction,
  canAddReactions = true,
  onEdit,
  onDelete,
}: MessageItemProps) {
  const { me } = useMessageMentions();
  const delivery = message.delivery;
  const isMentioningMe =
    me.userId !== null && mentionsPerson(message, me.userId, me.roleIds);
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
        "group/message focus-visible:bg-surface-hover has-[:focus-visible]:bg-surface-hover relative flex gap-3 rounded-md px-2 py-0.5 outline-none",
        isMentioningMe
          ? "bg-highlight/10 hover:bg-highlight/15 border-highlight rounded-none border-l-2"
          : "hover:bg-surface-hover",
        isGroupStart && "mt-4",
        delivery === "failed" &&
          "border-danger bg-danger/5 rounded-none border-l-2",
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
            hasAttachments={(message.attachments?.length ?? 0) > 0}
            onSave={saveEdit}
            onCancel={stopEditing}
            isSaving={isSavingEdit}
            error={editError}
          />
        ) : message.content || !message.attachments?.length ? (
          <MessageContent
            content={message.content}
            mentions={message}
            suffix={
              message.edited_at ? (
                <span className="text-content-subtle ml-1 text-[10px]">
                  {MESSAGE_EDITED_LABEL}
                </span>
              ) : null
            }
          />
        ) : null}

        {!isEditing && message.attachments?.length ? (
          <MessageAttachments attachments={message.attachments} />
        ) : null}

        {delivery === "failed" ? (
          <p
            role="alert"
            className="text-danger mt-0.5 flex items-center gap-1 text-xs"
          >
            <CircleAlert size={13} aria-hidden />
            {message.delivery_error || MESSAGE_NOT_SENT_LABEL}
          </p>
        ) : null}

        {!isEditing && !delivery && onToggleReaction ? (
          <MessageReactions
            reactions={message.reactions ?? []}
            onToggle={onToggleReaction}
            canAdd={canAddReactions}
          />
        ) : null}
      </div>

      {!isEditing && !delivery ? (
        <MessageActions
          canEdit={canEdit}
          canDelete={canDelete}
          onToggleReaction={canAddReactions ? onToggleReaction : undefined}
          onEdit={() => setIsEditing(true)}
          onDelete={() => setIsConfirmingDelete(true)}
        />
      ) : null}

      {isConfirmingDelete ? (
        <DeleteMessageModal
          message={message}
          author={author}
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
