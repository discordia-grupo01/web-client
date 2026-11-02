"use client";

import {
  describeNotification,
  formatMessageTimestamp,
  type MessageAuthor,
  NOTIFICATIONS_UNREAD_LABEL,
  type NotificationHistoryItem,
  UNKNOWN_USER_NAME,
} from "@discordia/client-shared";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

interface NotificationItemProps {
  item: NotificationHistoryItem;
  author: MessageAuthor | undefined;
  preview: string | null | undefined;
  isUnread: boolean;
  onOpen: (item: NotificationHistoryItem) => void;
}

export function NotificationItem({
  item,
  author,
  preview,
  isUnread,
  onOpen,
}: NotificationItemProps) {
  const name = author?.name ?? UNKNOWN_USER_NAME;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={cn(
          "hover:bg-surface-hover focus-visible:ring-accent flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none",
          !isUnread && "opacity-60",
        )}
      >
        <Avatar
          name={name}
          src={author?.avatarUrl}
          size={32}
          className="shrink-0 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className="text-content truncate text-sm font-semibold">
              {name}
            </span>
            <span className="text-content-subtle shrink-0 text-xs">
              {formatMessageTimestamp(item.occurred_at)}
            </span>
          </p>
          <p
            className={
              preview
                ? "text-content-muted line-clamp-2 text-sm break-words"
                : "text-content-subtle truncate text-sm"
            }
          >
            {preview ?? describeNotification(item)}
          </p>
        </div>
        {isUnread ? (
          <span
            role="img"
            aria-label={NOTIFICATIONS_UNREAD_LABEL}
            className="bg-accent size-2 shrink-0 rounded-full"
          />
        ) : null}
      </button>
    </li>
  );
}
