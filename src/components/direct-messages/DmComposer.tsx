"use client";

import {
  DM_BLOCKED_CANNOT_SEND,
  DM_MESSAGE_BLOCKED_NOTICE,
  dmInputPlaceholder,
  MAX_MESSAGE_LENGTH,
  SEND_MESSAGE_LABEL,
  validateMessageContent,
} from "@discordia/client-shared";

import { Paperclip, SendHorizontal, Smile } from "lucide-react";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { AutoGrowTextarea } from "@/components/ui/AutoGrowTextarea";
import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { EmojiPicker } from "@/components/messages/EmojiPicker";
import type { SendDmResult } from "@/services/conversations/useDirectMessages";
import { cn } from "@/lib/cn";

const COUNTER_THRESHOLD = MAX_MESSAGE_LENGTH - 200;

const ICON_BUTTON =
  "text-content-subtle hover:text-content-muted flex size-9 shrink-0 items-center justify-center rounded-md";

interface DmComposerProps {
  partnerName: string;
  blockedByMe: boolean;
  onSend: (content: string) => SendDmResult;
}

/** Composer de una conversacion directa: sin @everyone, con estados de bloqueo. */
export function DmComposer({
  partnerName,
  blockedByMe,
  onSend,
}: DmComposerProps) {
  const [draft, setDraft] = useState("");
  const [showBlockedToast, setShowBlockedToast] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = !blockedByMe && validateMessageContent(draft) === undefined;
  const length = [...draft].length;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) return;
    const result = onSend(draft);
    if (result === "sent") {
      setDraft("");
    } else if (result === "blocked") {
      setDraft("");
      setShowBlockedToast(true);
      setTimeout(() => setShowBlockedToast(false), 3500);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  }

  function insertEmoji(emoji: string) {
    setDraft((prev) => prev + emoji);
    textareaRef.current?.focus();
  }

  return (
    <form onSubmit={submit} className="shrink-0 px-2 pb-3 md:px-4 md:pb-4">
      {blockedByMe ? (
        <p className="border-danger/20 bg-danger/10 text-danger mb-2 rounded-lg border px-3 py-2 text-sm">
          {DM_BLOCKED_CANNOT_SEND}
        </p>
      ) : null}
      {showBlockedToast ? (
        <p className="border-danger/30 bg-danger/12 text-danger mb-2 rounded-lg border px-3 py-2 text-sm">
          {DM_MESSAGE_BLOCKED_NOTICE}
        </p>
      ) : null}

      <div
        className={cn(
          "bg-surface-input border-line focus-within:border-accent flex items-end gap-1 rounded-lg border px-1.5 py-1 transition-colors",
          blockedByMe && "opacity-60",
        )}
      >
        <button
          type="button"
          disabled
          aria-label="Adjuntar archivo"
          className={cn(ICON_BUTTON, "cursor-not-allowed opacity-60")}
        >
          <Paperclip size={18} />
        </button>

        <AutoGrowTextarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={blockedByMe}
          placeholder={dmInputPlaceholder(partnerName)}
          aria-label={dmInputPlaceholder(partnerName)}
          className="text-content placeholder:text-content-subtle min-w-0 flex-1 self-center border-none bg-transparent py-1.5 text-base outline-none placeholder:truncate md:text-sm"
        />

        <EmojiPicker
          icon={Smile}
          label="Emojis"
          onPick={insertEmoji}
          iconSize={18}
          triggerClassName={ICON_BUTTON}
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label={SEND_MESSAGE_LABEL}
          className={cn(
            ICON_BUTTON,
            canSend
              ? "bg-accent text-on-accent hover:bg-accent-strong hover:text-on-accent cursor-pointer"
              : "cursor-not-allowed opacity-60",
          )}
        >
          <SendHorizontal size={18} />
        </button>
      </div>

      {length >= COUNTER_THRESHOLD ? (
        <div className="mt-1 flex justify-end">
          <CharacterCounter length={length} max={MAX_MESSAGE_LENGTH} />
        </div>
      ) : null}
    </form>
  );
}
