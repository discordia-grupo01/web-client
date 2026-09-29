"use client";

import type { ServerSummary } from "@discordia/client-shared";

import { Home as HomeIcon, Plus } from "lucide-react";

import { SidePanel } from "@/components/layout/side-panel";
import { useMobilePanels } from "@/components/layout/mobile-panels-context";
import { ServerAvatar } from "@/components/ui/server-avatar";
import { serverIconSrc } from "@/services/servers/image-urls";
import { cn } from "@/lib/cn";

interface ServerRailProps {
  servers: ServerSummary[];
  selectedServerId: string | null;
  onSelect: (serverId: string | null) => void;
  onCreateClick: () => void;
}

export function ServerRail({
  servers,
  selectedServerId,
  onSelect,
  onCreateClick,
}: ServerRailProps) {
  const { openPanel } = useMobilePanels();

  return (
    <SidePanel position="left" isOpen={openPanel === "nav"}>
      <div
        className="flex w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto py-3"
        style={{ background: "var(--bg-servers)" }}
      >
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-label="Inicio"
          className={cn(
            "flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl transition-all",
            selectedServerId === null
              ? "bg-rail-active-bg text-rail-active-text"
              : "bg-rail-surface text-on-accent/70 hover:bg-rail-surface-hover hover:text-on-accent",
          )}
        >
          <HomeIcon size={20} />
        </button>

        <div className="bg-line-strong h-px w-8 shrink-0 rounded-full" />

        {servers.map((server) => (
          <ServerRailItem
            key={server.id}
            server={server}
            isActive={server.id === selectedServerId}
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
        <ServerAvatar
          name={server.name}
          src={serverIconSrc(server)}
          size={48}
        />
      </button>
    </div>
  );
}
