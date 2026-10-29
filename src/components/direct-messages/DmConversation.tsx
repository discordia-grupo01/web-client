"use client";

import {
  BLOCKED_BADGE_LABEL,
  DM_BLOCKED_CANNOT_SEND,
  dmInputPlaceholder,
  SELECT_CONVERSATION_NOTICE,
  type MessageAuthor,
} from "@discordia/client-shared";

import { MessageCircle } from "lucide-react";

import { MobileNavButton } from "@/components/layout/MobileNavButton";
import { ConnectionLostNotice } from "@/components/messages/ConnectionLostNotice";
import { MessageList } from "@/components/messages/MessageList";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { ActivityStatusDot } from "@/components/profile/ActivityStatusDot";
import { Avatar } from "@/components/ui/Avatar";
import type {
  ConversationSummary,
  SendDmResult,
} from "@/hooks/useDirectMessages";
import { usePendingMessages } from "@/hooks/usePendingMessages";
import { usePresenceOf } from "@/hooks/usePresence";

import { DmHistory } from "./DmHistory";
import { DmWelcome } from "./DmWelcome";

interface DmConversationProps {
  currentAuthor: MessageAuthor;
  activeSummary: ConversationSummary | null;
  onSend: (
    content: string,
    attachmentIds?: readonly string[],
    clientId?: string,
  ) => Promise<SendDmResult>;
  /** La sala personal esta unida: solo entonces se puede enviar. */
  isConnected: boolean;
  /** No cargo la lista y tampoco hay conexion: no tiene sentido pedir elegir una conversacion. */
  isOffline: boolean;
  /** Vuelve a pedir la lista de conversaciones. */
  onRetryLoad: () => void | Promise<unknown>;
  onOpenPartnerProfile: (partnerId: string) => void;
  /** Click en el nombre o la foto de un mensaje (puede ser el propio). */
  onOpenProfile: (userId: string) => void;
}

export function DmConversation({
  currentAuthor,
  activeSummary,
  onSend,
  isConnected,
  isOffline,
  onRetryLoad,
  onOpenPartnerProfile,
  onOpenProfile,
}: DmConversationProps) {
  const pending = usePendingMessages({
    chatKey: activeSummary?.conversationId ?? activeSummary?.partner.id ?? "",
    channelId: activeSummary?.conversationId ?? "",
    currentUserId: currentAuthor.id,
    isReady: isConnected,
    send: onSend,
  });
  const partnerStatus = usePresenceOf(activeSummary?.partner.id);

  if (!activeSummary) {
    return (
      <div
        className="hidden flex-1 flex-col overflow-hidden md:flex"
        style={{ background: "var(--bg-chat)" }}
      >
        {isOffline ? (
          <ConnectionLostNotice onRetry={onRetryLoad} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <div className="bg-surface-input flex size-16 items-center justify-center rounded-2xl">
              <MessageCircle size={28} className="text-content-subtle" />
            </div>
            <p className="text-content-subtle text-sm">
              {SELECT_CONVERSATION_NOTICE}
            </p>
          </div>
        )}
      </div>
    );
  }

  const { partner, blockedByMe, conversationId } = activeSummary;

  return (
    <div
      className="flex min-w-0 flex-1 flex-col overflow-hidden"
      style={{ background: "var(--bg-chat)" }}
    >
      <div
        className="flex h-12 shrink-0 items-center gap-2 px-2 md:px-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <MobileNavButton />
        <button
          type="button"
          onClick={() => onOpenPartnerProfile(partner.id)}
          aria-label={`Ver perfil de ${partner.name}`}
          className="hover:bg-surface-hover flex min-w-0 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 transition-colors"
        >
          <span className="relative shrink-0">
            <Avatar
              name={partner.name}
              src={partner.avatarUrl}
              size={24}
              className="rounded-full"
            />
            <ActivityStatusDot
              status={partnerStatus}
              size={10}
              ringColor="var(--bg-chat)"
              className="absolute -right-0.5 -bottom-0.5"
            />
          </span>
          <span className="font-display text-content truncate text-sm font-semibold">
            {partner.name}
          </span>
        </button>
        {blockedByMe ? (
          <span className="bg-danger/15 text-danger rounded-full px-2 py-0.5 text-[10px]">
            {BLOCKED_BADGE_LABEL}
          </span>
        ) : null}
      </div>

      {conversationId ? (
        <DmHistory
          key={conversationId}
          conversationId={conversationId}
          partner={partner}
          currentAuthor={currentAuthor}
          withPending={pending.withPending}
          onMessagesChange={pending.reconcile}
          onRetryMessage={pending.retry}
          onDiscardMessage={pending.discard}
          onOpenProfile={onOpenProfile}
        />
      ) : (
        // Borrador: nadie escribio todavia, no hay nada que pedirle al back.
        <MessageList
          welcome={<DmWelcome partner={partner} />}
          label={`Conversación con ${partner.name}`}
          messages={pending.withPending([])}
          authors={{ [currentAuthor.id]: currentAuthor }}
          currentUserId={currentAuthor.id}
          canManageMessages={false}
          canSendMessages
          onToggleReaction={() => {}}
          onEditMessage={() => {}}
          onDeleteMessage={() => {}}
          onRetryMessage={pending.retry}
          onDiscardMessage={pending.discard}
          onOpenProfile={onOpenProfile}
        />
      )}

      {blockedByMe ? (
        <p className="border-danger/20 bg-danger/10 text-danger mx-2 mb-2 rounded-lg border px-3 py-2 text-sm md:mx-4">
          {DM_BLOCKED_CANNOT_SEND}
        </p>
      ) : null}
      <MessageComposer
        placeholder={dmInputPlaceholder(partner.name)}
        onSend={pending.onSend}
        uploadTarget={{ to: partner.id }}
        disabled={blockedByMe}
      />
    </div>
  );
}
