"use client";

import { type Role } from "@discordia/client-shared";

import { RolesPanel } from "./RolesPanel";

interface RolesModalProps {
  serverId: string;
  serverName: string;
  isOwner: boolean;
  myRoles: Role[];
  onClose: () => void;
}

/**
 * Modal de administración de roles del servidor: envuelve RolesPanel.
 */
export function RolesModal({
  serverId,
  serverName,
  isOwner,
  myRoles,
  onClose,
}: RolesModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="border-line-strong relative flex h-dvh w-full overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.55)] sm:h-[88dvh] sm:max-w-[740px] sm:rounded-[20px] sm:border"
        style={{ background: "var(--bg-modal)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <RolesPanel
          serverId={serverId}
          serverName={serverName}
          isOwner={isOwner}
          myRoles={myRoles}
        />
      </div>
    </div>
  );
}
