"use client";

import {
  BLOCKED_BADGE_LABEL,
  SELECT_CONVERSATION_NOTICE,
  type MessageAuthor,
} from "@discordia/client-shared";

import { MessageCircle } from "lucide-react";

import { MobileNavButton } from "@/components/layout/MobileNavButton";
import { ServerAvatar } from "@/components/ui/ServerAvatar";
import type {
  ConversationSummary,
  DmMessage,
  SendDmResult,
} from "@/services/conversations/useDirectMessages";

import { DmComposer } from "./DmComposer";
import { DmMessageList } from "./DmMessageList";

interface DmConversationProps {
  currentAuthor: MessageAuthor;
  activeSummary: ConversationSummary | null;
  messages: DmMessage[];
  onSend: (content: string) => SendDmResult;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onOpenPartnerProfile: (partnerId: string) => void;
}

export function DmConversation({
  currentAuthor,
  activeSummary,
  messages,
  onSend,
  onToggleReaction,
  onEditMessage,
  onDeleteMessage,
  onOpenPartnerProfile,
}: DmConversationProps) {
  if (!activeSummary) {
    return (
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{ background: "var(--bg-chat)" }}
      >
        <div className="p-2 md:hidden">
          <MobileNavButton />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div className="bg-surface-input flex size-16 items-center justify-center rounded-2xl">
            <MessageCircle size={28} className="text-content-subtle" />
          </div>
          <p className="text-content-subtle text-sm">
            {SELECT_CONVERSATION_NOTICE}
          </p>
        </div>
      </div>
    );
  }

  const { partner, blockedByMe, blocksMe } = activeSummary;

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
          <ServerAvatar
            name={partner.name}
            src={partner.avatarUrl}
            size={24}
            className="rounded-full"
          />
          <span className="font-display text-content truncate text-sm font-semibold">
            {partner.name}
          </span>
        </button>
        {blockedByMe || blocksMe ? (
          <span className="bg-danger/15 text-danger rounded-full px-2 py-0.5 text-[10px]">
            {blockedByMe ? BLOCKED_BADGE_LABEL : "te bloqueó"}
          </span>
        ) : null}
      </div>

      <DmMessageList
        partner={partner}
        currentAuthor={currentAuthor}
        messages={messages}
        onToggleReaction={onToggleReaction}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
      />

      <DmComposer
        partnerName={partner.name}
        blockedByMe={blockedByMe}
        onSend={onSend}
      />
    </div>
  );
}
