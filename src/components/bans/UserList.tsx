import { ShieldBan } from "lucide-react";

import { SettingsEmptyState } from "@/components/ui/settings/SettingsEmptyState";
import { type ProfileSummary } from "@/utils/userProfile";

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
  onSelect?: (item: UserListItem) => void;
  disableActions?: boolean;
}

/** Los usuarios de la pagina actual, o el estado vacio. */
export function UserList({
  items,
  emptyMessage,
  actionsFor,
  onSelect,
  disableActions = false,
}: UserListProps) {
  if (items.length === 0) {
    return <SettingsEmptyState icon={ShieldBan} text={emptyMessage} />;
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
          onSelect={onSelect ? () => onSelect(item) : undefined}
          isDisabled={disableActions}
        />
      ))}
    </ul>
  );
}
