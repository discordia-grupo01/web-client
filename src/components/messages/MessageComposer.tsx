"use client";

import {
  ATTACH_FILE_LABEL,
  CHAT_FEATURE_NOT_AVAILABLE,
  EMOJI_PICKER_LABEL,
  MAX_MESSAGE_LENGTH,
  messageInputPlaceholder,
  SEND_MESSAGE_LABEL,
  validateMentionEveryone,
  validateMessageContent,
} from "@discordia/client-shared";

import { Paperclip, SendHorizontal, Smile } from "lucide-react";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { AutoGrowTextarea } from "@/components/ui/AutoGrowTextarea";
import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/cn";

import { EmojiPicker } from "./EmojiPicker";

const COUNTER_THRESHOLD = MAX_MESSAGE_LENGTH - 200;

const ICON_BUTTON =
  "text-content-subtle hover:text-content-muted flex size-9 shrink-0 items-center justify-center rounded-md";

interface MessageComposerProps {
  channelName: string;
  onSend: (content: string) => void;
  disabled?: boolean;
  /** Puede usar `@everyone`/`@here`. Por defecto `false` (no gatea si nadie lo pasa, ej. en DMs). */
  canMentionEveryone?: boolean;
}

export function MessageComposer({
  channelName,
  onSend,
  disabled = false,
  canMentionEveryone = false,
}: MessageComposerProps) {
  const [draft, setDraft] = useState("");
  const [mentionError, setMentionError] = useState<string | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = !disabled && validateMessageContent(draft) === undefined;
  const length = [...draft].length;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) return;
    const mentionIssue = validateMentionEveryone(draft, canMentionEveryone);
    if (mentionIssue) {
      setMentionError(mentionIssue);
      return;
    }
    setMentionError(undefined);
    onSend(draft);
    setDraft("");
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
      <div className="bg-surface-input border-line focus-within:border-accent flex items-end gap-1 rounded-lg border px-1.5 py-1 transition-colors">
        <button
          type="button"
          disabled
          aria-label={ATTACH_FILE_LABEL}
          title={CHAT_FEATURE_NOT_AVAILABLE}
          className={cn(ICON_BUTTON, "cursor-not-allowed opacity-60")}
        >
          <Paperclip size={18} />
        </button>

        <AutoGrowTextarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setMentionError(undefined);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={messageInputPlaceholder(channelName)}
          aria-label={messageInputPlaceholder(channelName)}
          className="text-content placeholder:text-content-subtle min-w-0 flex-1 self-center border-none bg-transparent py-1.5 text-base outline-none placeholder:truncate md:text-sm"
        />

        <EmojiPicker
          icon={Smile}
          label={EMOJI_PICKER_LABEL}
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

      <FieldError message={mentionError} />

      {length >= COUNTER_THRESHOLD ? (
        <div className="mt-1 flex justify-end">
          <CharacterCounter length={length} max={MAX_MESSAGE_LENGTH} />
        </div>
      ) : null}
    </form>
  );
}
