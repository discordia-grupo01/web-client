"use client";

import {
  ATTACH_FILE_LABEL,
  ATTACHMENT_ACCEPT,
  type AttachmentLimitOptions,
  type AttachmentTarget,
  attachmentTooLargeMessage,
  type BoostLevel,
  canBoostAttachmentLimit,
  canOfferPremiumForAttachment,
  canUseCustomEmoji,
  EMOJI_PICKER_LABEL,
  MAX_MESSAGE_LENGTH,
  PREMIUM_ATTACHMENT_ACCEPT,
  SEND_MESSAGE_LABEL,
  validateAttachment,
  validateAttachmentCount,
  validateMessageContent,
} from "@discordia/client-shared";

import { Paperclip, SendHorizontal, Smile } from "lucide-react";
import {
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/cn";
import { emojiImageSrc } from "@/utils/image-urls";

import { useChatPremiumOffer } from "@/contexts/ChatPremiumOfferContext";
import { useAttachmentUploads } from "@/components/messages/hooks/useAttachmentUploads";
import type { SendMessageResult } from "@/hooks/useChannelMessages";
import { useMentionDraft } from "@/components/messages/hooks/useMentionDraft";

import { AttachmentChips, type PendingAttachment } from "./AttachmentChips";
import { EmojiPicker } from "./EmojiPicker";
import { MentionSuggestions } from "./MentionSuggestions";
import { MessageEditor, type MessageEditorHandle } from "./MessageEditor";
import { useMessageMentions } from "@/contexts/MentionsContext";
import { useOwnPremium } from "@/contexts/OwnProfileContext";
import { openSettingsSection } from "@/utils/settingsRequest";
import { requestServerBoosts } from "@/utils/serverBoostsRequest";

import { AttachmentBoostOffer } from "./AttachmentBoostOffer";
import { AttachmentPremiumOffer } from "./AttachmentPremiumOffer";
import { CustomEmojiPremiumOffer } from "./CustomEmojiPremiumOffer";
import { useCustomEmojiPicker } from "./hooks/useCustomEmojiPicker";
import { useChatDragDrop } from "./hooks/useChatDragDrop";
import { emojiPreviews } from "./utils/emojiPreviews";
import { useServerEmojiCatalog } from "@/contexts/ServerEmojisContext";

const COUNTER_THRESHOLD = MAX_MESSAGE_LENGTH - 200;

const ICON_BUTTON =
  "text-content-subtle hover:text-content-muted flex size-9 shrink-0 items-center justify-center rounded-md";

interface MessageComposerProps {
  placeholder: string;
  onSend: (
    content: string,
    attachmentIds?: string[],
  ) => void | Promise<SendMessageResult>;
  uploadTarget: AttachmentTarget;
  /** Solo en canales de un servidor: en un DM los boosts no cambian el límite. */
  serverBoost?: { serverId: string; level: BoostLevel; boostCount: number };
  /** El servidor del canal: `undefined` en un mensaje directo. */
  server?: { id: string; name: string; icon_url: string | null };
  disabled?: boolean;
}

type AttachmentOffer = "none" | "boost" | "premium" | "custom_emoji";

function attachmentOfferFor(limits: AttachmentLimitOptions): AttachmentOffer {
  if (canBoostAttachmentLimit(limits)) return "boost";
  if (canOfferPremiumForAttachment(limits)) return "premium";
  return "none";
}

export function MessageComposer({
  placeholder,
  onSend,
  uploadTarget,
  serverBoost,
  server,
  disabled = false,
}: MessageComposerProps) {
  const { sources } = useMessageMentions();
  const editorRef = useRef<MessageEditorHandle>(null);
  const suggestionsId = useId();
  const draft = useMentionDraft({ editorRef, sources });
  const [sendError, setSendError] = useState<string | undefined>();
  const [offer, setOffer] = useState<AttachmentOffer>("none");
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const { uploadAll, forget } = useAttachmentUploads();
  const premium = useOwnPremium();
  // Sumarse a una reacción que pide Premium se ofrece acá abajo, porque el
  // cartel va debajo del compositor y lo dispara un mensaje de la lista.
  const premiumOffer = useChatPremiumOffer();
  // Los emojis se piden recién cuando se abre el selector, una vez por sesión.
  const { load: loadServerEmojis } = useServerEmojiCatalog();
  const customEmojis = useCustomEmojiPicker(server?.id ?? null, premium);
  const { isDragging, dragHandlers } = useChatDragDrop(addFiles);
  // El `:nombre:` de los emojis elegidos se dibuja con su imagen al lado.
  const previews = useMemo(
    () =>
      emojiPreviews(draft.text, draft.pickedEmojis, (id) => {
        const emoji = customEmojis.byId[id];
        return emoji ? emojiImageSrc(emoji.image_url) : null;
      }),
    [draft.text, draft.pickedEmojis, customEmojis.byId],
  );
  const limits: AttachmentLimitOptions = {
    premium,
    serverLevel: serverBoost?.level,
  };
  // El limite del back cuenta el texto con los tokens `<@id>`, no lo visible.
  const canSend =
    !disabled &&
    !isSending &&
    validateMessageContent(draft.encoded, attachments.length > 0) === undefined;
  const length = [...draft.encoded].length;

  function showError(
    message: string | undefined,
    nextOffer: AttachmentOffer = "none",
  ) {
    setSendError(message);
    setOffer(nextOffer);
    // La oferta por una reacción la disparó un mensaje de la lista; cualquier
    // cosa que se haga acá abajo la deja atrás.
    premiumOffer.clear();
  }

  function clearDraft() {
    draft.reset();
    setAttachments([]);
    forget();
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSend) return;
    showError(undefined);
    setIsSending(true);

    const uploads = await uploadAll(attachments, uploadTarget);
    if (!uploads.ok) {
      setIsSending(false);
      showError(uploads.message);
      return;
    }

    const outcome = onSend(draft.encoded, uploads.ids);
    if (outcome === undefined) {
      setIsSending(false);
      clearDraft();
      editorRef.current?.focus();
      return;
    }

    const result = await outcome;
    setIsSending(false);
    if (result.ok) clearDraft();
    else showError(result.message);
    editorRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing) return;

    if (draft.handleSuggestionKey(event)) return;

    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    submit();
  }

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const chosen = Array.from(files);
    const rejected = chosen
      .map((file) => validateAttachment(file, limits))
      .find((error) => error !== undefined);
    const valid = chosen.filter((file) => !validateAttachment(file, limits));
    const overLimit = validateAttachmentCount(attachments.length, valid.length);
    if (overLimit) return showError(overLimit);

    const tooLarge = chosen.some(
      (file) =>
        validateAttachment(file, limits) ===
        attachmentTooLargeMessage(file.size, limits),
    );
    showError(rejected, tooLarge ? attachmentOfferFor(limits) : "none");
    setAttachments((prev) => [
      ...prev,
      ...valid.map((file) => ({ id: crypto.randomUUID(), file })),
    ]);
  }

  function insertEmoji(emoji: string) {
    draft.append(emoji);
    editorRef.current?.focus();
  }

  /**
   * Un emoji del servidor se manda como `<:nombre:id>`. Si pide Premium y no
   * hay, no se escribe nada: se muestra la oferta, igual que con los adjuntos.
   */
  function insertCustomEmoji(id: string) {
    const emoji = customEmojis.byId[id];
    if (!emoji) return;
    if (
      !canUseCustomEmoji({
        emoji,
        serverId: server?.id ?? null,
        isPremium: premium,
      })
    ) {
      showError(undefined, "custom_emoji");
      return;
    }
    draft.pickEmoji(emoji);
    editorRef.current?.focus();
  }

  return (
    <form
      onSubmit={submit}
      className="relative shrink-0 px-2 pb-3 md:px-4 md:pb-4"
      {...dragHandlers}
    >
      {isDragging ? (
        <div
          aria-hidden
          className="border-accent bg-accent/10 pointer-events-none absolute inset-0 z-10 m-2 flex items-center justify-center rounded-lg border-2 border-dashed"
        >
          <p className="text-accent text-sm font-medium select-none">
            Suelta los archivos para adjuntarlos
          </p>
        </div>
      ) : null}
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
        disabled={isSending}
        onRemove={(id) =>
          setAttachments((prev) => prev.filter((item) => item.id !== id))
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        accept={premium ? PREMIUM_ATTACHMENT_ACCEPT : ATTACHMENT_ACCEPT}
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

        <MessageEditor
          ref={editorRef}
          value={draft.text}
          segments={draft.segments}
          emojiPreviews={previews}
          onChange={(text, cursor) => {
            draft.handleChange(text, cursor);
            showError(undefined);
          }}
          onCursorMove={draft.handleCursorMove}
          onKeyDown={handleKeyDown}
          aria-controls={draft.isOpen ? suggestionsId : undefined}
          aria-autocomplete="list"
          disabled={disabled}
          readOnly={isSending}
          placeholder={placeholder}
          aria-label={placeholder}
          className="text-content min-w-0 flex-1 self-center border-none bg-transparent py-1.5 text-base outline-none md:text-sm [&_[data-slate-placeholder]]:top-1.5"
        />

        <EmojiPicker
          icon={Smile}
          label={EMOJI_PICKER_LABEL}
          onPick={insertEmoji}
          onPickCustom={insertCustomEmoji}
          custom={customEmojis.categories}
          lockedTooltips={customEmojis.lockedTooltips}
          lockedCategoryIds={customEmojis.lockedCategoryIds}
          showsPremiumNote={customEmojis.hasLocked}
          onOpenPremium={() => openSettingsSection("subscriptions")}
          onOpenChange={(isOpen) => {
            if (isOpen) loadServerEmojis();
          }}
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
      {offer === "boost" && serverBoost ? (
        <AttachmentBoostOffer
          level={serverBoost.level}
          boostCount={serverBoost.boostCount}
          onShowBenefits={() =>
            requestServerBoosts(serverBoost.serverId, "benefits")
          }
          onOpenPremium={() => openSettingsSection("subscriptions")}
        />
      ) : null}
      {offer === "premium" ? (
        <AttachmentPremiumOffer
          onOpenPremium={() => openSettingsSection("subscriptions")}
        />
      ) : null}
      {offer === "custom_emoji" ? (
        <CustomEmojiPremiumOffer
          onOpenPremium={() => openSettingsSection("subscriptions")}
          onClose={() => setOffer("none")}
        />
      ) : null}
      {offer === "none" && premiumOffer.offer === "custom_emoji_reaction" ? (
        <CustomEmojiPremiumOffer
          variant="reaction"
          onOpenPremium={() => openSettingsSection("subscriptions")}
          onClose={premiumOffer.clear}
        />
      ) : null}

      {length >= COUNTER_THRESHOLD ? (
        <div className="mt-1 flex justify-end">
          <CharacterCounter length={length} max={MAX_MESSAGE_LENGTH} />
        </div>
      ) : null}
    </form>
  );
}
