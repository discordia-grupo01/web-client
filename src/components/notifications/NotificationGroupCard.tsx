"use client";

import {
  type MessageAuthor,
  NOTIFICATIONS_DIRECT_MESSAGE_LABEL,
  NOTIFICATIONS_SHOW_LESS_LABEL,
  NOTIFICATIONS_UNKNOWN_CHANNEL,
  type NotificationGroup,
  type NotificationHistoryItem,
  notificationPlace,
  notificationsShowMoreLabel,
  type ServerSummary,
  UNKNOWN_USER_NAME,
} from "@discordia/client-shared";

import { Hash } from "lucide-react";
import { useState } from "react";

import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Avatar } from "@/components/ui/Avatar";
import { CountBadge } from "@/components/ui/CountBadge";
import { serverIconSrc } from "@/utils/image-urls";

export const NOTIFICATIONS_PREVIEW_SIZE = 3;

interface NotificationGroupCardProps {
  group: NotificationGroup;
  servers: readonly ServerSummary[];
  authors: Record<string, MessageAuthor>;
  previews: Record<string, string | null>;
  isUnread: (item: NotificationHistoryItem) => boolean;
  onOpen: (item: NotificationHistoryItem) => void;
}

export function NotificationGroupCard({
  group,
  servers,
  authors,
  previews,
  isUnread,
  onOpen,
}: NotificationGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [first] = group.items;
  const hidden = group.items.length - NOTIFICATIONS_PREVIEW_SIZE;
  const visibleItems = isExpanded
    ? group.items
    : group.items.slice(0, NOTIFICATIONS_PREVIEW_SIZE);

  const unreadCount = group.items.filter(isUnread).length;
  const isDirect = group.kind === "direct_message";
  const partner = group.partnerId ? authors[group.partnerId] : undefined;
  const place = notificationPlace(first, servers);
  const server = servers.find((candidate) => candidate.id === group.serverId);

  const title = isDirect
    ? (partner?.name ?? UNKNOWN_USER_NAME)
    : (place.channelName ?? NOTIFICATIONS_UNKNOWN_CHANNEL);
  const subtitle = isDirect
    ? NOTIFICATIONS_DIRECT_MESSAGE_LABEL
    : place.serverName;
  const avatarName = isDirect ? title : (place.serverName ?? title);
  const avatarSrc = isDirect
    ? partner?.avatarUrl
    : server
      ? serverIconSrc(server)
      : null;

  return (
    <section className="border-line bg-surface-input/40 shrink-0 overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => onOpen(first)}
        className="hover:bg-surface-hover focus-visible:ring-accent border-line flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Avatar
          name={avatarName}
          src={avatarSrc}
          size={36}
          className={isDirect ? "shrink-0 rounded-full" : "shrink-0 rounded-xl"}
        />
        <div className="min-w-0 flex-1">
          <p className="text-content flex items-center gap-1 truncate text-sm font-semibold">
            {isDirect ? null : (
              <Hash size={14} className="text-content-subtle shrink-0" />
            )}
            <span className="truncate">{title}</span>
          </p>
          {subtitle ? (
            <p className="text-content-subtle truncate text-xs">{subtitle}</p>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <CountBadge count={unreadCount} label={`${unreadCount} sin leer`} />
        ) : null}
      </button>

      <ul className="flex flex-col">
        {visibleItems.map((item) => (
          <NotificationItem
            key={item.message_id}
            item={item}
            author={authors[item.author_id]}
            preview={previews[item.message_id]}
            isUnread={isUnread(item)}
            onOpen={onOpen}
          />
        ))}
      </ul>

      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          className="text-content-muted hover:text-content hover:bg-surface-hover border-line w-full cursor-pointer border-t px-4 py-2 text-center text-xs font-medium transition-colors"
        >
          {isExpanded
            ? NOTIFICATIONS_SHOW_LESS_LABEL
            : notificationsShowMoreLabel(hidden)}
        </button>
      ) : null}
    </section>
  );
}
