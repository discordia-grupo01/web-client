"use client";

import type { ServerSummary } from "@discordia/client-shared";

import { Home as HomeIcon, Plus } from "lucide-react";

import { SidePanel } from "@/components/layout/SidePanel";
import { useMobilePanels } from "@/components/layout/MobilePanelsContext";
import { Avatar } from "@/components/ui/Avatar";
import { serverIconSrc } from "@/services/servers/image-urls";
import { cn } from "@/lib/cn";

interface ServerRailProps {
  servers: ServerSummary[];
  selectedServerId: string | null;
  /** El botón "Inicio" abre Mensajes Directos: se resalta cuando esa vista está activa. */
  isDirectMessagesActive: boolean;
  unreadDmCount: number;
  onSelect: (serverId: string | null) => void;
  onOpenDirectMessages: () => void;
  onCreateClick: () => void;
}

export function ServerRail({
  servers,
  selectedServerId,
  isDirectMessagesActive,
  unreadDmCount,
  onSelect,
  onOpenDirectMessages,
  onCreateClick,
}: ServerRailProps) {
  const { openPanel } = useMobilePanels();

  return (
    <SidePanel position="left" isOpen={openPanel === "nav"}>
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
            <span
              className="bg-danger border-rail-surface absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full border-2 px-1 text-[9px] font-bold text-white"
              style={{ height: 18 }}
            >
              {unreadDmCount}
            </span>
          ) : null}
        </div>

        <div className="bg-line-strong h-px w-8 shrink-0 rounded-full" />

        {servers.map((server) => (
          <ServerRailItem
            key={server.id}
            server={server}
            isActive={!isDirectMessagesActive && server.id === selectedServerId}
            onClick={() => onSelect(server.id)}
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
  onClick,
}: {
  server: ServerSummary;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative shrink-0">
      {isActive ? (
        <div className="bg-server-pill absolute top-1/2 -left-2 h-8 w-1 -translate-y-1/2 rounded-r-full" />
      ) : null}
      <button
        type="button"
        title={server.name}
        onClick={onClick}
        className="cursor-pointer overflow-hidden rounded-2xl"
      >
        <Avatar name={server.name} src={serverIconSrc(server)} size={48} />
      </button>
    </div>
  );
}
