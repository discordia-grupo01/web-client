import { ShieldBan } from "lucide-react";

import { type ProfileSummary } from "@/lib/userProfile";

import { UserRow, type UserRowAction } from "./UserRow";

export interface UserListItem {
  userId: string;
  /** `null` si el back todavia no replico el perfil de este usuario. */
  profile: ProfileSummary | null | undefined;
  subtitle?: string;
}

interface UserListProps {
  items: UserListItem[];
  emptyMessage: string;
  actionsFor: (item: UserListItem) => UserRowAction[];
  disableActions?: boolean;
}

/** Los usuarios de la pagina actual, o el estado vacio. */
export function UserList({
  items,
  emptyMessage,
  actionsFor,
  disableActions = false,
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
          profile={item.profile}
          subtitle={item.subtitle}
          actions={actionsFor(item)}
          isDisabled={disableActions}
        />
      ))}
    </ul>
  );
}
