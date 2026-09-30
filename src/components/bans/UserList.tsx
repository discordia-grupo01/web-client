import { type PublicUser } from "@discordia/client-shared";

import { ShieldBan } from "lucide-react";

import { UserRow, type UserRowAction } from "./UserRow";

export interface UserListItem {
  userId: string;
  subtitle?: string;
}

interface UserListProps {
  items: UserListItem[];
  profiles: Record<string, PublicUser>;
  /** Texto del estado vacio (sin baneados, sin resultados, sin miembros...). */
  emptyMessage: string;
  /** Acciones de cada fila. `isLoading` lo completa la lista segun `busyUserId`. */
  actionsFor: (userId: string) => UserRowAction[];
  /** Usuario cuya accion esta en curso: su fila carga y los botones se bloquean. */
  busyUserId?: string | null;
}

/** Los usuarios de la pagina actual, o el estado vacio. */
export function UserList({
  items,
  profiles,
  emptyMessage,
  actionsFor,
  busyUserId = null,
}: UserListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-surface-raised text-content-muted flex flex-col items-center gap-2 rounded-xl px-4 py-8 text-center">
        <ShieldBan size={28} aria-hidden="true" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <UserRow
          key={item.userId}
          userId={item.userId}
          profile={profiles[item.userId]}
          subtitle={item.subtitle}
          actions={actionsFor(item.userId).map((action) => ({
            ...action,
            isLoading: busyUserId === item.userId,
          }))}
          isDisabled={busyUserId !== null}
        />
      ))}
    </ul>
  );
}
