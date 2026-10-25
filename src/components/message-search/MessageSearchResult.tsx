"use client";

import {
  JUMP_TO_MESSAGE_LABEL,
  type Message,
  type MessageAuthor,
  messageAttachmentsCount,
} from "@discordia/client-shared";
import { Hash, Paperclip } from "lucide-react";

import { MessageContent } from "@/components/messages/MessageContent";
import { MessageHeader } from "@/components/messages/MessageHeader";
import { Avatar } from "@/components/ui/Avatar";

interface MessageSearchResultProps {
  message: Message;
  author: MessageAuthor;
  channelName: string;
  /** Termino buscado, para resaltarlo. */
  term: string;
  onOpen: () => void;
}

/** Un resultado: canal, autor, fecha y contenido con el termino resaltado. */
export function MessageSearchResult({
  message,
  author,
  channelName,
  term,
  onOpen,
}: MessageSearchResultProps) {
  const attachments = message.attachments?.length ?? 0;

  return (
    <article className="border-line bg-surface hover:border-line-strong group/result relative rounded-lg border p-3 transition-colors">
      <p className="text-content-muted mb-2 flex items-center gap-1 text-xs font-semibold">
        <Hash size={12} aria-hidden="true" />
        <span className="truncate">{channelName}</span>
      </p>
      <div className="flex gap-3">
        <Avatar
          name={author.name}
          src={author.avatarUrl}
          size={32}
          className="shrink-0 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <MessageHeader author={author} createdAt={message.inserted_at} />
          <MessageContent
            content={message.content}
            mentions={message}
            highlight={term}
          />
          {attachments > 0 ? (
            <p className="text-content-subtle mt-1 flex items-center gap-1 text-xs">
              <Paperclip size={12} aria-hidden="true" />
              {messageAttachmentsCount(attachments)}
            </p>
          ) : null}
        </div>
      </div>
      {/* Toda la tarjeta es cliqueable; el boton queda por encima del contenido. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${JUMP_TO_MESSAGE_LABEL} de ${author.name} en #${channelName}`}
        className="focus-visible:ring-accent-strong absolute inset-0 cursor-pointer rounded-lg focus-visible:ring-2 focus-visible:outline-none"
      />
      <span className="bg-surface-raised text-content-muted border-line pointer-events-none absolute top-2 right-2 hidden rounded-md border px-2 py-0.5 text-[11px] font-medium group-hover/result:block">
        {JUMP_TO_MESSAGE_LABEL}
      </span>
    </article>
  );
}
