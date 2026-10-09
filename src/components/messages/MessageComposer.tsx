"use client";

import {
  ATTACH_FILE_LABEL,
  EMOJI_PICKER_LABEL,
  MAX_MESSAGE_LENGTH,
  SEND_MESSAGE_LABEL,
  validateMessageContent,
} from "@discordia/client-shared";

import { Paperclip, SendHorizontal, Smile } from "lucide-react";
import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/cn";

import type { SendMessageResult } from "@/services/messages/useChannelMessages";
import { useMentionDraft } from "@/services/messages/useMentionDraft";

import { AttachmentChips, type PendingAttachment } from "./AttachmentChips";
import { EmojiPicker } from "./EmojiPicker";
import { MentionSuggestions } from "./MentionSuggestions";
import { MentionTextarea } from "./MentionTextarea";
import { useMessageMentions } from "./MentionsContext";

const COUNTER_THRESHOLD = MAX_MESSAGE_LENGTH - 200;

const ICON_BUTTON =
  "text-content-subtle hover:text-content-muted flex size-9 shrink-0 items-center justify-center rounded-md";

interface MessageComposerProps {
  /** Texto del campo vacio (ej. `messageInputPlaceholder(canal)` o `dmInputPlaceholder(nombre)`). */
  placeholder: string;
  /**
   * Si devuelve una promesa, el borrador se conserva hasta que el envio sale
   * bien (un fallo lo deja para reintentar). Si devuelve `void`, se limpia al
   * instante.
   */
  onSend: (content: string) => void | Promise<SendMessageResult>;
  disabled?: boolean;
}

export function MessageComposer({
  placeholder,
  onSend,
  disabled = false,
}: MessageComposerProps) {
  const { sources } = useMessageMentions();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsId = useId();
  const draft = useMentionDraft({ textareaRef, sources });
  const [sendError, setSendError] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  // El limite del back cuenta el texto con los tokens `<@id>`, no lo visible.
  const canSend =
    !disabled &&
    !isSending &&
    validateMessageContent(draft.encoded) === undefined;
  const length = [...draft.encoded].length;

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) return;
    setSendError(undefined);

    const outcome = onSend(draft.encoded);
    if (outcome === undefined) {
      draft.reset();
      setAttachments([]);
      return;
    }

    setIsSending(true);
    const result = await outcome;
    setIsSending(false);
    if (result.ok) {
      draft.reset();
      setAttachments([]);
    } else setSendError(result.message);
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;

    if (draft.handleSuggestionKey(event)) return;

    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    submit();
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files, (file) => ({
      id: crypto.randomUUID(),
      file,
    }));
    setAttachments((prev) => [...prev, ...added]);
  }

  function insertEmoji(emoji: string) {
    draft.append(emoji);
    textareaRef.current?.focus();
  }

  return (
    <form
      onSubmit={submit}
      className="relative shrink-0 px-2 pb-3 md:px-4 md:pb-4"
    >
      {draft.isOpen ? (
        <MentionSuggestions
          id={suggestionsId}
          query={draft.query}
          candidates={draft.candidates}
          selectedIndex={draft.selectedIndex}
          onPick={draft.pick}
          className="inset-x-2 md:inset-x-4"
        />
      ) : null}
      <AttachmentChips
        attachments={attachments}
        onRemove={(id) =>
          setAttachments((prev) => prev.filter((item) => item.id !== id))
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          addFiles(event.target.files);
          // Permite volver a elegir el mismo archivo despues de quitarlo.
          event.target.value = "";
        }}
      />
      <div className="bg-surface-input border-line focus-within:border-accent flex items-end gap-1 rounded-lg border px-1.5 py-1 transition-colors">
        <button
          type="button"
          disabled={disabled || isSending}
          onClick={() => fileInputRef.current?.click()}
          aria-label={ATTACH_FILE_LABEL}
          title={ATTACH_FILE_LABEL}
          className={cn(ICON_BUTTON, "cursor-pointer")}
        >
          <Paperclip size={18} />
        </button>

        <MentionTextarea
          ref={textareaRef}
          value={draft.text}
          segments={draft.segments}
          wrapperClassName="min-w-0 flex-1 self-center"
          onChange={(event) => {
            draft.handleChange(event);
            setSendError(undefined);
          }}
          onSelect={draft.handleSelect}
          onKeyDown={handleKeyDown}
          aria-controls={draft.isOpen ? suggestionsId : undefined}
          aria-autocomplete="list"
          disabled={disabled || isSending}
          placeholder={placeholder}
          aria-label={placeholder}
          className="text-content placeholder:text-content-subtle w-full border-none bg-transparent py-1.5 text-base outline-none placeholder:truncate md:text-sm"
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

      <FieldError message={sendError} />

      {length >= COUNTER_THRESHOLD ? (
        <div className="mt-1 flex justify-end">
          <CharacterCounter length={length} max={MAX_MESSAGE_LENGTH} />
        </div>
      ) : null}
    </form>
  );
}
