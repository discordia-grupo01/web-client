"use client";

import { ActivityStatusDot } from "@/components/profile/activity-status-dot";
import { ServerAvatar } from "@/components/ui/server-avatar";
import type { User } from "@/types/auth.types";

interface UserPanelProps {
  user: User;
  onClick: () => void;
}

/**
 * Barra fija al pie de la lista de canales: avatar + nombre propios, con
 * acceso directo al perfil (CA1). El icono de edicion vive dentro del modal
 * de perfil (`OwnProfileModal`), no aca.
 */
export function UserPanel({ user, onClick }: UserPanelProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-surface-hover flex w-full shrink-0 cursor-pointer items-center gap-2 px-2 py-2 text-left transition-colors"
      style={{
        background: "var(--bg-user-panel)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="relative shrink-0">
        <ServerAvatar
          name={user.name}
          src={user.avatar_url ? "/api/profile/avatar" : null}
          size={32}
          className="rounded-full"
        />
        {/* Estado de actividad mock: no hay presencia real en identify-service. */}
        <ActivityStatusDot
          status="online"
          size={11}
          ringColor="var(--bg-user-panel)"
          className="absolute right-0 bottom-0"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-content truncate text-sm leading-tight font-semibold">
          {user.name}
        </div>
        <div className="text-content-subtle truncate text-[11px]">
          Ver mi perfil
        </div>
      </div>
    </button>
  );
}
