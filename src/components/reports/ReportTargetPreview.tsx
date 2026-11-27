"use client";

import {
  type Message,
  type MessageAuthor,
  messageAttachmentsCount,
} from "@discordia/client-shared";
import { Paperclip } from "lucide-react";

import { MessageContent } from "@/components/messages/MessageContent";
import { MessageHeader } from "@/components/messages/MessageHeader";
import { Avatar } from "@/components/ui/Avatar";

type ReportTargetPreviewProps =
  | {
      kind: "message";
      message: Message;
      author: MessageAuthor;
      onOpenProfile?: () => void;
    }
  | { kind: "user"; name: string; avatarSrc: string | null };

/** El mensaje o el usuario reportado. Lo usan el modal y la lista de reportes. */
export function ReportTargetPreview(props: ReportTargetPreviewProps) {
  if (props.kind === "user") {
    return (
      <div className="border-line bg-surface-input flex items-center gap-3 rounded-xl border p-3">
        <Avatar
          name={props.name}
          src={props.avatarSrc}
          size={32}
          className="shrink-0 rounded-full"
        />
        <p className="font-display text-content min-w-0 truncate text-sm font-semibold">
          {props.name}
        </p>
      </div>
    );
  }

  const { message, author, onOpenProfile } = props;
  const attachments = message.attachments?.length ?? 0;
  const avatar = (
    <Avatar
      name={author.name}
      src={author.avatarUrl}
      size={32}
      className="rounded-full"
    />
  );
  return (
    <div className="border-line bg-surface-input flex gap-3 rounded-xl border px-3 py-2.5 text-left">
      {onOpenProfile ? (
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={`Ver perfil de ${author.name}`}
          className="mt-0.5 shrink-0 cursor-pointer self-start hover:opacity-80"
        >
          {avatar}
        </button>
      ) : (
        <div className="mt-0.5 shrink-0">{avatar}</div>
      )}
      <div className="min-w-0 flex-1 break-words">
        <MessageHeader
          author={author}
          createdAt={message.inserted_at}
          onOpenProfile={onOpenProfile}
        />
        {message.content ? (
          <div className="line-clamp-3">
            <MessageContent content={message.content} mentions={message} />
          </div>
        ) : null}
        {attachments > 0 ? (
          <p className="text-content-subtle mt-1 flex items-center gap-1 text-xs">
            <Paperclip size={12} aria-hidden="true" />
            {messageAttachmentsCount(attachments)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
