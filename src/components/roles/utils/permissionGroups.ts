import type { RolePermission } from "@discordia/client-shared";

export interface RolePermissionGroup {
  label: string;
  permissions: RolePermission[];
}

export const ROLE_PERMISSION_GROUPS: RolePermissionGroup[] = [
  {
    label: "General",
    permissions: [
      "VIEW_CHANNELS",
      "MANAGE_CHANNELS",
      "MANAGE_ROLES",
      "MANAGE_SERVER",
      "CREATE_INVITE",
    ],
  },
  {
    label: "Texto",
    permissions: [
      "SEND_MESSAGES",
      "MANAGE_MESSAGES",
      "MENTION_EVERYONE",
      "ADD_REACTIONS",
    ],
  },
  { label: "Voz", permissions: ["CONNECT"] },
  { label: "Moderación", permissions: ["KICK_MEMBERS", "BAN_MEMBERS"] },
];
