"use client";

import {
  canRespondToTransfer,
  describeTransferNotification,
  formatMessageTimestamp,
  type MessageAuthor,
  NOTIFICATIONS_TRANSFER_ACCEPT_LABEL,
  NOTIFICATIONS_TRANSFER_REJECT_LABEL,
  NOTIFICATIONS_TRANSFER_TITLE,
  NOTIFICATIONS_UNREAD_LABEL,
  type NotificationHistoryItem,
  type ServerSummary,
} from "@discordia/client-shared";

import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { serverIconSrc } from "@/utils/image-urls";
import {
  acceptTransferRequest,
  rejectTransferRequest,
} from "@/services/ownership-transfers/client";

interface TransferNotificationCardProps {
  item: NotificationHistoryItem;
  servers: readonly ServerSummary[];
  authors: Record<string, MessageAuthor>;
  me: MessageAuthor | null;
  isUnread: boolean;
  onRead: (item: NotificationHistoryItem) => void;
  onAnswered: () => void;
}

export function TransferNotificationCard({
  item,
  servers,
  authors,
  me,
  isUnread,
  onRead,
  onAnswered,
}: TransferNotificationCardProps) {
  const [pending, setPending] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState("");
  const server = servers.find((candidate) => candidate.id === item.server_id);
  const nameOf = (userId: string) =>
    (me?.id === userId ? me.name : authors[userId]?.name) ?? null;
  const text = describeTransferNotification(
    item,
    me?.id,
    nameOf,
    server?.name ?? null,
  );
  const canRespond = canRespondToTransfer(item, me?.id);

  async function respond(action: "accept" | "reject") {
    if (!item.server_id) return;
    setPending(action);
    setError("");
    const request =
      action === "accept" ? acceptTransferRequest : rejectTransferRequest;
    const result = await request(item.server_id, item.message_id);
    setPending(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onRead(item);
    onAnswered();
  }

  return (
    <section
      className={cn(
        "border-line bg-surface-input/40 shrink-0 overflow-hidden rounded-xl border",
        !isUnread && !canRespond && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => onRead(item)}
        className="hover:bg-surface-hover focus-visible:ring-accent flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <Avatar
          name={server?.name ?? NOTIFICATIONS_TRANSFER_TITLE}
          src={server ? serverIconSrc(server) : null}
          size={36}
          className="shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className="text-content truncate text-sm font-semibold">
              {NOTIFICATIONS_TRANSFER_TITLE}
            </span>
            <span className="text-content-subtle shrink-0 text-xs">
              {formatMessageTimestamp(item.occurred_at)}
            </span>
          </p>
          <p className="text-content-muted text-sm break-words">{text}</p>
        </div>
        {isUnread ? (
          <span
            role="img"
            aria-label={NOTIFICATIONS_UNREAD_LABEL}
            className="bg-accent size-2 shrink-0 rounded-full"
          />
        ) : null}
      </button>

      {canRespond ? (
        <div className="border-line flex items-center gap-2 border-t px-4 py-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void respond("reject")}
            isLoading={pending === "reject"}
            disabled={pending !== null}
            className="flex-1 py-2"
          >
            {NOTIFICATIONS_TRANSFER_REJECT_LABEL}
          </Button>
          <Button
            type="button"
            onClick={() => void respond("accept")}
            isLoading={pending === "accept"}
            disabled={pending !== null}
            className="flex-1 py-2"
          >
            {NOTIFICATIONS_TRANSFER_ACCEPT_LABEL}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="text-danger border-line border-t px-4 py-2 text-sm"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
