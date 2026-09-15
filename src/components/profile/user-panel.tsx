"use client";

import { ServerAvatar } from "@/components/servers/server-avatar";
import type { User } from "@/features/auth/types";

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
      <ServerAvatar
        name={user.name}
        src={user.avatar_url ? "/api/profile/avatar" : null}
        size={32}
        className="shrink-0 rounded-full"
      />
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
