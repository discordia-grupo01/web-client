"use client";

import {
  BLOCK_USER_LABEL,
  BLOCKED_BADGE_LABEL,
  type BlockUserResult,
  SELECT_CONVERSATION_NOTICE,
  type MessageAuthor,
  UNBLOCK_USER_LABEL,
} from "@discordia/client-shared";

import { Ban, MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { MobileNavButton } from "@/components/layout/MobileNavButton";
import { ServerAvatar } from "@/components/ui/ServerAvatar";
import type {
  ConversationSummary,
  DmMessage,
  SendDmResult,
} from "@/services/conversations/useDirectMessages";

import { BlockUserModal } from "./BlockUserModal";
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
  onBlock: (userId: string) => Promise<BlockUserResult>;
  onUnblock: (userId: string) => Promise<BlockUserResult>;
}

export function DmConversation({
  currentAuthor,
  activeSummary,
  messages,
  onSend,
  onToggleReaction,
  onEditMessage,
  onDeleteMessage,
  onBlock,
  onUnblock,
}: DmConversationProps) {
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

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
        <ServerAvatar
          name={partner.name}
          src={partner.avatarUrl}
          size={24}
          className="rounded-full"
        />
        <span className="font-display text-content truncate text-sm font-semibold">
          {partner.name}
        </span>
        {blockedByMe || blocksMe ? (
          <span className="bg-danger/15 text-danger rounded-full px-2 py-0.5 text-[10px]">
            {blockedByMe ? BLOCKED_BADGE_LABEL : "te bloqueó"}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setIsBlockModalOpen(true)}
          className="text-content-subtle hover:text-content ml-auto flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs"
        >
          {blockedByMe ? <ShieldCheck size={14} /> : <Ban size={14} />}
          {blockedByMe ? UNBLOCK_USER_LABEL : BLOCK_USER_LABEL}
        </button>
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

      {isBlockModalOpen ? (
        <BlockUserModal
          userName={partner.name}
          isBlocked={blockedByMe}
          onConfirm={() =>
            blockedByMe ? onUnblock(partner.id) : onBlock(partner.id)
          }
          onClose={() => setIsBlockModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
