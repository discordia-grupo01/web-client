"use client";

import {
  filterNotificationHistory,
  groupNotificationHistory,
  type MessageAuthor,
  isNotificationVisible,
  notificationPreview,
  NOTIFICATIONS_CLOSE_LABEL,
  NOTIFICATIONS_EMPTY_BY_TAB,
  NOTIFICATIONS_LOAD_OLDER_LABEL,
  NOTIFICATIONS_MARK_ALL_READ_LABEL,
  NOTIFICATIONS_LOADING,
  NOTIFICATIONS_TITLE,
  type NotificationHistoryItem,
  type NotificationTab,
  RETRY_LABEL,
  type ServerSummary,
} from "@discordia/client-shared";

import { Bell, CheckCheck, CircleAlert, Loader2, X } from "lucide-react";
import { type RefObject, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { NotificationGroupCard } from "@/components/notifications/NotificationGroupCard";
import { NotificationTabs } from "@/components/notifications/NotificationTabs";
import { useFloatingPanel } from "@/hooks/useFloatingPanel";
import { useMarkAllRead } from "@/hooks/useMarkAllRead";
import { useNotificationAuthors } from "@/hooks/useNotificationAuthors";
import { useNotificationMessages } from "@/hooks/useNotificationMessages";
import type { NotificationHistoryState } from "@/hooks/useNotificationHistory";
import type { NotificationReadsState } from "@/hooks/useNotificationReads";
import { cn } from "@/lib/cn";

const ACTION_CLASS =
  "text-content hover:text-content-muted inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium underline underline-offset-2 disabled:cursor-wait disabled:opacity-70";

interface NotificationCenterProps {
  history: NotificationHistoryState;
  reads: NotificationReadsState;
  unread: { hasUnread: boolean; markAllRead: () => Promise<boolean> };
  servers: readonly ServerSummary[];
  me: MessageAuthor | null;
  anchorRef: RefObject<HTMLElement>;
  onClose: () => void;
  onOpenMention: (serverId: string, channelId: string) => void;
  onOpenDirectMessage: (partner: MessageAuthor | string) => void;
}

export function NotificationCenter({
  history,
  reads,
  unread,
  servers,
  me,
  anchorRef,
  onClose,
  onOpenMention,
  onOpenDirectMessage,
}: NotificationCenterProps) {
  const [tab, setTab] = useState<NotificationTab>("unread");
  const markAll = useMarkAllRead({ reads, unread });
  const authors = useNotificationAuthors(history.items);
  const messages = useNotificationMessages(history.items);
  const { panelRef, position } = useFloatingPanel({
    enabled: true,
    isOpen: true,
    onClose,
    anchorRef,
    align: "side",
  });

  const groups = useMemo(
    () =>
      groupNotificationHistory(
        filterNotificationHistory(history.items, tab, reads.isUnread).reverse(),
      ),
    [history.items, tab, reads.isUnread],
  );

  const previews = useMemo(() => {
    const nameOf = (kind: "user" | "role", id: string) => {
      if (kind !== "user") return null;
      return (me?.id === id ? me.name : authors[id]?.name) ?? null;
    };
    return Object.fromEntries(
      Object.entries(messages).map(([id, message]) => [
        id,
        notificationPreview(message, nameOf),
      ]),
    );
  }, [messages, authors, me]);

  function open(item: NotificationHistoryItem) {
    if (item.kind === "direct_message") {
      onOpenDirectMessage(authors[item.author_id] ?? item.author_id);
    } else if (item.server_id && item.channel_id) {
      onOpenMention(item.server_id, item.channel_id);
    }
    onClose();
  }

  const oldestLoaded = history.items.at(-1);
  const canLoadMore =
    history.hasMore &&
    oldestLoaded !== undefined &&
    (tab === "unread"
      ? reads.isUnread(oldestLoaded)
      : isNotificationVisible(oldestLoaded, reads.isUnread));
  const isEmpty =
    history.status === "ready" && groups.length === 0 && !canLoadMore;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={NOTIFICATIONS_TITLE}
      className={cn(
        "border-line-strong fixed z-50 flex h-[min(640px,calc(100dvh-16px))] w-[440px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-2xl border shadow-[0_24px_64px_rgba(0,0,0,0.55)]",
        "max-sm:!inset-2 max-sm:!h-auto max-sm:!w-auto max-sm:!max-w-none",
        !position && "invisible",
      )}
      style={{
        top: position?.top ?? -9999,
        left: position?.left,
        background: "var(--bg-modal)",
      }}
    >
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <Bell size={18} className="text-content-subtle" aria-hidden />
        <h2 className="text-content flex-1 text-base font-semibold">
          {NOTIFICATIONS_TITLE}
        </h2>
        <button
          type="button"
          onClick={() => void markAll.markAllRead()}
          disabled={!markAll.canMarkAllRead}
          aria-busy={markAll.isMarkingAll}
          title={NOTIFICATIONS_MARK_ALL_READ_LABEL}
          aria-label={NOTIFICATIONS_MARK_ALL_READ_LABEL}
          className="bg-surface-input text-content-subtle border-line flex size-8 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
        >
          {markAll.isMarkingAll ? (
            <Loader2 size={15} className="animate-spin" aria-hidden />
          ) : (
            <CheckCheck size={15} />
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={NOTIFICATIONS_CLOSE_LABEL}
          className="bg-surface-input text-content-subtle border-line flex size-8 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-110"
        >
          <X size={14} />
        </button>
      </div>

      {markAll.error ? (
        <p role="alert" className="text-danger px-4 pb-2 text-sm">
          {markAll.error}
        </p>
      ) : null}

      <NotificationTabs
        value={tab}
        onChange={setTab}
        label={NOTIFICATIONS_TITLE}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        {history.status === "loading" ? (
          <p
            role="status"
            className="text-content-muted flex items-center justify-center gap-2 py-10 text-sm"
          >
            <Loader2 size={16} className="animate-spin" aria-hidden />
            {NOTIFICATIONS_LOADING}
          </p>
        ) : null}

        {history.status === "error" ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 py-10 text-center"
          >
            <CircleAlert size={20} className="text-danger" aria-hidden />
            <p className="text-content-muted text-sm">{history.error}</p>
            <button
              type="button"
              onClick={() => void history.reload()}
              className={ACTION_CLASS}
            >
              {RETRY_LABEL}
            </button>
          </div>
        ) : null}

        {isEmpty ? (
          <p className="text-content-muted py-10 text-center text-sm">
            {NOTIFICATIONS_EMPTY_BY_TAB[tab]}
          </p>
        ) : null}

        {history.status === "ready" && canLoadMore ? (
          <div className="flex flex-col items-center gap-2 pb-1">
            {history.loadMoreError ? (
              <p role="alert" className="text-danger text-xs">
                {history.loadMoreError}
              </p>
            ) : null}
            <button
              type="button"
              onClick={history.loadMore}
              disabled={history.isLoadingMore}
              className={ACTION_CLASS}
            >
              {history.isLoadingMore ? (
                <Loader2 size={14} className="animate-spin" aria-hidden />
              ) : null}
              {history.isLoadingMore
                ? NOTIFICATIONS_LOADING
                : NOTIFICATIONS_LOAD_OLDER_LABEL}
            </button>
          </div>
        ) : null}

        {history.status === "ready"
          ? groups.map((group) => (
              <NotificationGroupCard
                key={group.key}
                group={group}
                servers={servers}
                authors={authors}
                previews={previews}
                isUnread={reads.isUnread}
                onOpen={open}
              />
            ))
          : null}
      </div>
    </div>,
    document.body,
  );
}
