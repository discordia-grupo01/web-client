"use client";

import {
  formatMessageTime,
  MESSAGE_EDITED_LABEL,
  DISCARD_MESSAGE_LABEL,
  MESSAGE_NOT_SENT_LABEL,
  mentionsPerson,
  type MessageAttachment,
  type MessageAuthor,
  type MessageMentions,
  type MessageReaction,
  RETRY_LABEL,
  SENDING_LABEL,
} from "@discordia/client-shared";

import { CircleAlert } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

import { MessageAttachments } from "./MessageAttachments";
import { MessageActions } from "./MessageActions";
import { useMessageMentions } from "@/contexts/MentionsContext";
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
  /** Mensaje propio que se esta enviando o no se pudo enviar (solo existe en pantalla). */
  delivery?: "sending" | "waiting" | "failed";
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
  /** Solo en un mensaje fallido. */
  onRetry?: () => void;
  onDiscard?: () => void;
  /** Sin esto el nombre y la foto no son cliqueables. */
  onOpenProfile?: (userId: string) => void;
  /** Recien se salto a este mensaje (desde la busqueda). */
  isFocused?: boolean;
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
  onRetry,
  onDiscard,
  onOpenProfile,
  isFocused = false,
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
        "transition-colors duration-700",
        isFocused &&
          "bg-accent-strong/15 hover:bg-accent-strong/20 rounded-none shadow-[inset_2px_0_0_var(--accent-bright)]",
        delivery === "failed" &&
          "rounded-none shadow-[inset_2px_0_0_var(--border-strong)]",
        delivery === "waiting" && "opacity-60",
      )}
      aria-busy={delivery === "sending" || delivery === "waiting" || undefined}
    >
      {isGroupStart ? (
        onOpenProfile ? (
          <button
            type="button"
            onClick={() => onOpenProfile(message.user_id)}
            aria-label={`Ver perfil de ${author.name}`}
            className="mt-0.5 h-fit shrink-0 cursor-pointer rounded-full"
          >
            <Avatar
              name={author.name}
              src={author.avatarUrl}
              size={AVATAR_SIZE}
              className="rounded-full"
            />
          </button>
        ) : (
          <Avatar
            name={author.name}
            src={author.avatarUrl}
            size={AVATAR_SIZE}
            className="mt-0.5 rounded-full"
          />
        )
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
          <MessageHeader
            author={author}
            createdAt={message.inserted_at}
            onOpenProfile={
              onOpenProfile ? () => onOpenProfile(message.user_id) : undefined
            }
          />
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

        {delivery === "waiting" ? (
          <p role="status" className="text-content-subtle mt-0.5 text-xs">
            {SENDING_LABEL}
          </p>
        ) : null}

        {delivery === "failed" ? (
          <p
            role="alert"
            className="text-content-subtle mt-1 flex flex-wrap items-center gap-x-1.5 text-xs"
          >
            <CircleAlert size={12} className="shrink-0" aria-hidden />
            {message.delivery_error || MESSAGE_NOT_SENT_LABEL}
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="text-content cursor-pointer font-medium underline-offset-2 hover:underline"
              >
                {RETRY_LABEL}
              </button>
            ) : null}
            {onRetry && onDiscard ? <span aria-hidden>·</span> : null}
            {onDiscard ? (
              <button
                type="button"
                onClick={onDiscard}
                className="text-content cursor-pointer font-medium underline-offset-2 hover:underline"
              >
                {DISCARD_MESSAGE_LABEL}
              </button>
            ) : null}
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
