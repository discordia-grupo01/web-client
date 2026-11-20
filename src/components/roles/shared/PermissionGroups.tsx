"use client";

import { PERMISSION_COPY, type RolePermission } from "@discordia/client-shared";

import { SettingsGroup } from "@/components/ui/settings/SettingsGroup";
import { SettingsRow } from "@/components/ui/settings/SettingsRow";
import { Switch } from "@/components/ui/Switch";

import { ROLE_PERMISSION_GROUPS } from "../utils/permissionGroups";

interface PermissionGroupsProps {
  enabled: RolePermission[];
  disabled?: boolean;
  onToggle: (perm: RolePermission, on: boolean) => void;
}

export function PermissionGroups({
  enabled,
  disabled = false,
  onToggle,
}: PermissionGroupsProps) {
  return (
    <div className="space-y-6">
      {ROLE_PERMISSION_GROUPS.map((group) => (
        <SettingsGroup key={group.label} label={group.label}>
          <div>
            {group.permissions.map((perm) => (
              <SettingsRow
                key={perm}
                label={PERMISSION_COPY[perm].label}
                hint={PERMISSION_COPY[perm].desc}
                disabled={disabled}
                control={
                  <Switch
                    checked={enabled.includes(perm)}
                    label={PERMISSION_COPY[perm].label}
                    disabled={disabled}
                    onChange={(on) => onToggle(perm, on)}
                  />
                }
              />
            ))}
          </div>
        </SettingsGroup>
      ))}
    </div>
  );
}
