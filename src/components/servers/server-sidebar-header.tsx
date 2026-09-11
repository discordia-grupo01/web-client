"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { LeaveServerModal } from "@/components/servers/leave-server-modal";
import { ServerAvatar } from "@/components/servers/server-avatar";
import { useAuth } from "@/features/auth/auth-context";
import type { ServerSummary } from "@/features/servers/types";

interface ServerSidebarHeaderProps {
  server: ServerSummary;
  onLeft: () => void;
}

/** Header del panel de canales: ícono + nombre + acción de abandonar. */
export function ServerSidebarHeader({
  server,
  onLeft,
}: ServerSidebarHeaderProps) {
  const { user } = useAuth();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const isOwner = user !== null && String(user.id) === server.owner_id;

  return (
    <div className="border-line flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <ServerAvatar
        name={server.name}
        src={`/api/servers/${server.id}/icon`}
        size={24}
        className="rounded-full"
      />
      <span className="font-display text-content min-w-0 flex-1 truncate text-sm font-semibold">
        {server.name}
      </span>
      <button
        type="button"
        onClick={() => setIsLeaveModalOpen(true)}
        aria-label="Abandonar servidor"
        title="Abandonar servidor"
        className="text-content-subtle hover:bg-surface-hover hover:text-danger flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
      >
        <LogOut size={15} />
      </button>

      {isLeaveModalOpen ? (
        <LeaveServerModal
          serverId={server.id}
          serverName={server.name}
          isOwner={isOwner}
          onClose={() => setIsLeaveModalOpen(false)}
          onLeft={onLeft}
        />
      ) : null}
    </div>
  );
}
