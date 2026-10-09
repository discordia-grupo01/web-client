"use client";

import {
  DELETE_MESSAGE_CANCEL_ACTION,
  DELETE_MESSAGE_CONFIRM_ACTION,
  DELETE_MESSAGE_CONFIRM_BODY,
  DELETE_MESSAGE_CONFIRM_TITLE,
  type MessageAuthor,
  type MessageMentions,
} from "@discordia/client-shared";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { Avatar } from "@/components/ui/Avatar";

import { MessageContent } from "./MessageContent";
import { MessageHeader } from "./MessageHeader";

interface DeleteMessageModalProps {
  /** El mensaje que se va a eliminar, completo, para que se vea cual es. */
  message: { content: string; inserted_at: string } & MessageMentions;
  author: MessageAuthor;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmacion antes de eliminar un mensaje: no hay forma de deshacerlo. */
export function DeleteMessageModal({
  message,
  author,
  onConfirm,
  onCancel,
}: DeleteMessageModalProps) {
  return (
    <ModalShell
      onClose={onCancel}
      maxWidth={400}
      labelledBy="delete-message-title"
    >
      <div className="flex flex-col items-center gap-5 px-7 py-8 text-center">
        <div className="bg-danger/15 text-danger flex size-16 shrink-0 items-center justify-center rounded-2xl">
          <Trash2 size={28} />
        </div>
        <div>
          <h2
            id="delete-message-title"
            className="font-display text-content mb-2 text-xl font-bold"
          >
            {DELETE_MESSAGE_CONFIRM_TITLE}
          </h2>
          <p className="text-content-muted text-sm leading-relaxed">
            {DELETE_MESSAGE_CONFIRM_BODY}
          </p>
        </div>
        <div className="border-line bg-surface-input flex max-h-48 w-full gap-3 overflow-y-auto rounded-xl border px-3 py-2.5 text-left">
          <Avatar
            name={author.name}
            src={author.avatarUrl}
            size={32}
            className="mt-0.5 shrink-0 rounded-full"
          />
          <div className="min-w-0 flex-1 break-words">
            <MessageHeader author={author} createdAt={message.inserted_at} />
            <MessageContent content={message.content} mentions={message} />
          </div>
        </div>
        <div className="flex w-full gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {DELETE_MESSAGE_CANCEL_ACTION}
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} autoFocus>
            {DELETE_MESSAGE_CONFIRM_ACTION}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
