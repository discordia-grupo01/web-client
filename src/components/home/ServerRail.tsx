"use client";

import {
  isServerMuted,
  NO_UNREAD_FLAGS,
  type ServerSummary,
  UNREAD_MESSAGES_LABEL,
  type UnreadFlags,
  serverSuspendedLabel,
} from "@discordia/client-shared";

import { Home as HomeIcon, Plus } from "lucide-react";
import { useCallback, useState } from "react";

import { ServerContextMenu } from "@/components/home/ServerContextMenu";
import { SidePanel } from "@/components/layout/SidePanel";
import { useMobilePanels } from "@/contexts/MobilePanelsContext";
import { useOptionalNotificationSettings } from "@/contexts/NotificationSettingsContext";
import { Avatar } from "@/components/ui/Avatar";
import { CountBadge } from "@/components/ui/CountBadge";
import { SideTooltip } from "@/components/ui/Tooltip";
import { serverIconSrc } from "@/utils/image-urls";
import { cn } from "@/lib/cn";

interface ServerRailProps {
  servers: ServerSummary[];
  selectedServerId: string | null;
  isDirectMessagesActive: boolean;
  isDockedOnMobile: boolean;
  unreadDmCount: number;
  unreadByServer: Record<string, UnreadFlags>;
  onMarkServerRead: (serverId: string) => void;
  onSelect: (serverId: string | null) => void;
  onOpenDirectMessages: () => void;
  onCreateClick: () => void;
}

export function ServerRail({
  servers,
  selectedServerId,
  isDirectMessagesActive,
  isDockedOnMobile,
  unreadDmCount,
  unreadByServer,
  onMarkServerRead,
  onSelect,
  onOpenDirectMessages,
  onCreateClick,
}: ServerRailProps) {
  const { openPanel } = useMobilePanels();

  return (
    <SidePanel
      position="left"
      isOpen={openPanel === "nav"}
      isDocked={isDockedOnMobile}
    >
      <div
        className="flex w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto py-3"
        style={{ background: "var(--bg-servers)" }}
      >
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={onOpenDirectMessages}
            aria-label="Mensajes directos"
            title="Mensajes directos"
            className={cn(
              "flex size-12 cursor-pointer items-center justify-center rounded-2xl transition-all",
              isDirectMessagesActive
                ? "bg-rail-active-bg text-rail-active-text"
                : "bg-rail-surface text-on-accent/70 hover:bg-rail-surface-hover hover:text-on-accent",
            )}
          >
            <HomeIcon size={20} />
          </button>
          {unreadDmCount > 0 && !isDirectMessagesActive ? (
            <CountBadge
              count={unreadDmCount}
              label={`${unreadDmCount} conversaciones sin leer`}
              className="border-rail-surface absolute -top-0.5 -right-0.5 border-2"
            />
          ) : null}
        </div>

        <div className="bg-servers-divider h-px w-8 shrink-0 rounded-full" />

        {servers.map((server) => (
          <ServerRailItem
            key={server.id}
            server={server}
            isActive={!isDirectMessagesActive && server.id === selectedServerId}
            unread={unreadByServer[server.id] ?? NO_UNREAD_FLAGS}
            onClick={() => onSelect(server.id)}
            onMarkRead={() => onMarkServerRead(server.id)}
          />
        ))}

        <button
          type="button"
          onClick={onCreateClick}
          aria-label="Crear servidor"
          className="bg-rail-surface text-success hover:bg-success/15 flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all hover:rounded-2xl"
        >
          <Plus size={22} />
        </button>
      </div>
    </SidePanel>
  );
}

function ServerRailItem({
  server,
  isActive,
  unread,
  onClick,
  onMarkRead,
}: {
  server: ServerSummary;
  isActive: boolean;
  unread: UnreadFlags;
  onClick: () => void;
  onMarkRead: () => void;
}) {
  const [menuAt, setMenuAt] = useState<{ x: number; y: number } | null>(null);
  const closeMenu = useCallback(() => setMenuAt(null), []);
  const notificationSettings = useOptionalNotificationSettings();
  const isSuspended = server.suspended === true;
  const isMuted =
    notificationSettings !== null &&
    isServerMuted(notificationSettings.settings, server.id);
  const visibleUnread = isSuspended ? NO_UNREAD_FLAGS : unread;
  const label = isSuspended
    ? serverSuspendedLabel(server.name)
    : unread.unread && unread.mentionCount === 0
      ? `${server.name}, ${UNREAD_MESSAGES_LABEL.toLowerCase()}`
      : server.name;

  return (
    <div className={cn("relative shrink-0", isMuted && "opacity-60")}>
      {isActive || visibleUnread.unread ? (
        <div
          aria-hidden
          className={cn(
            "bg-server-pill absolute top-1/2 -left-2 w-1 -translate-y-1/2 rounded-r-full",
            isActive ? "h-8" : "h-2",
          )}
        />
      ) : null}
      <SideTooltip
        label={isSuspended ? serverSuspendedLabel(server.name) : server.name}
      >
        <button
          type="button"
          aria-label={label}
          aria-haspopup={isSuspended ? undefined : "menu"}
          onClick={onClick}
          onContextMenu={(event) => {
            if (isSuspended) return;
            event.preventDefault();
            setMenuAt({ x: event.clientX, y: event.clientY });
          }}
          className="relative cursor-pointer overflow-hidden rounded-2xl"
        >
          <span className={cn("block", isSuspended && "saturate-50")}>
            <Avatar name={server.name} src={serverIconSrc(server)} size={48} />
          </span>
          {isSuspended ? (
            <span aria-hidden className="absolute inset-0 bg-black/50" />
          ) : null}
        </button>
      </SideTooltip>
      {visibleUnread.mentionCount > 0 ? (
        <CountBadge
          count={visibleUnread.mentionCount}
          label={`${visibleUnread.mentionCount} menciones sin leer en ${server.name}`}
          className="border-rail-surface absolute -right-0.5 -bottom-0.5 border-2"
        />
      ) : null}
      {menuAt ? (
        <ServerContextMenu
          position={menuAt}
          serverName={server.name}
          canMarkRead={visibleUnread.unread}
          onMarkRead={onMarkRead}
          onClose={closeMenu}
        />
      ) : null}
    </div>
  );
}
