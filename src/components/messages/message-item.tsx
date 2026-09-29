"use client";

import {
  ADD_REACTION_LABEL,
  formatMessageTime,
  type Message,
  type MessageAuthor,
} from "@discordia/client-shared";

import { SmilePlus } from "lucide-react";

import { ServerAvatar } from "@/components/ui/server-avatar";
import { cn } from "@/lib/cn";

import { EmojiPicker } from "./emoji-picker";
import { MessageContent } from "./message-content";
import { MessageHeader } from "./message-header";
import { MessageReactions } from "./message-reactions";

const AVATAR_SIZE = 38;

interface MessageItemProps {
  message: Message;
  author: MessageAuthor;
  isGroupStart: boolean;
  onToggleReaction: (emoji: string) => void;
}

export function MessageItem({
  message,
  author,
  isGroupStart,
  onToggleReaction,
}: MessageItemProps) {
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
        <MessageContent content={message.content} />
        <MessageReactions
          reactions={message.reactions}
          onToggle={onToggleReaction}
        />
      </div>

      <div className="bg-surface-raised border-line absolute -top-3 right-2 flex rounded-lg border opacity-0 shadow-md transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100">
        <EmojiPicker
          icon={SmilePlus}
          label={ADD_REACTION_LABEL}
          onPick={onToggleReaction}
          triggerClassName="text-content-subtle hover:text-content hover:bg-surface-hover flex size-8 items-center justify-center rounded-lg"
        />
      </div>
    </article>
  );
}
