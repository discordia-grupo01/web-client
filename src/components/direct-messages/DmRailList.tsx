"use client";

import {
  BLOCKED_BADGE_LABEL,
  DIRECT_MESSAGES_TITLE,
  NEW_DIRECT_MESSAGE_LABEL,
  NO_CONVERSATIONS_YET,
  type User,
} from "@discordia/client-shared";

import { Plus } from "lucide-react";

import { ActivityStatusDot } from "@/components/profile/ActivityStatusDot";
import { UserPanel } from "@/components/profile/UserPanel";
import { Avatar } from "@/components/ui/Avatar";
import type { ConversationSummary } from "@/services/conversations/useDirectMessages";
import { cn } from "@/lib/cn";

interface DmRailListProps {
  conversations: ConversationSummary[];
  activePartnerId: string | null;
  onSelect: (partnerId: string) => void;
  onStartNew: () => void;
  ownProfile: User | null;
  onOpenOwnProfile: () => void;
}

function DmPartnerAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="relative shrink-0">
      <Avatar name={name} src={avatarUrl} size={32} className="rounded-full" />
      {/* Presencia mock: no hay estado de actividad real para otros usuarios. */}
      <ActivityStatusDot
        status="online"
        size={11}
        ringColor="var(--bg-channels)"
        className="absolute right-0 bottom-0"
      />
    </div>
  );
}

export function DmRailList({
  conversations,
  activePartnerId,
  onSelect,
  onStartNew,
  ownProfile,
  onOpenOwnProfile,
}: DmRailListProps) {
  return (
    <div
      className="flex w-60 shrink-0 flex-col overflow-hidden"
      style={{ background: "var(--bg-channels)" }}
    >
      <div
        className="border-line flex h-12 shrink-0 items-center px-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span className="font-display text-content text-sm font-semibold">
          {DIRECT_MESSAGES_TITLE}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-content-subtle text-[11px] font-bold tracking-wider uppercase">
            Directos
          </span>
          <button
            type="button"
            onClick={onStartNew}
            aria-label={NEW_DIRECT_MESSAGE_LABEL}
            title={NEW_DIRECT_MESSAGE_LABEL}
            className="text-content-subtle hover:text-content flex size-5 cursor-pointer items-center justify-center rounded transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>

        {conversations.length === 0 ? (
          <p className="text-content-subtle px-2 text-xs">
            {NO_CONVERSATIONS_YET}
          </p>
        ) : (
          conversations.map(
            ({
              conversationId,
              partner,
              lastMessage,
              isUnread,
              blockedByMe,
            }) => {
              const isActive = partner.id === activePartnerId;
              return (
                <button
                  key={conversationId}
                  type="button"
                  onClick={() => onSelect(partner.id)}
                  className={cn(
                    "mb-0.5 flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                    isActive ? "bg-accent/20" : "hover:bg-surface-hover",
                  )}
                >
                  <DmPartnerAvatar
                    name={partner.name}
                    avatarUrl={partner.avatarUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={cn(
                          "truncate text-sm font-medium",
                          isActive ? "text-content" : "text-content-muted",
                        )}
                      >
                        {partner.name}
                      </span>
                      {blockedByMe ? (
                        <span className="bg-danger/15 text-danger shrink-0 rounded px-1 py-px text-[9px]">
                          {BLOCKED_BADGE_LABEL}
                        </span>
                      ) : null}
                    </div>
                    {lastMessage ? (
                      <p className="text-content-subtle truncate text-[11px]">
                        {lastMessage.content}
                      </p>
                    ) : null}
                  </div>
                  {isUnread ? (
                    <span
                      className="bg-danger size-2 shrink-0 rounded-full"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            },
          )
        )}
      </div>

      {ownProfile ? (
        <UserPanel user={ownProfile} onClick={onOpenOwnProfile} />
      ) : null}
    </div>
  );
}
