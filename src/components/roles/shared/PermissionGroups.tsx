"use client";

import { PERMISSION_COPY, type RolePermission } from "@discordia/client-shared";

import { SettingsGroup } from "@/components/ui/settings/SettingsGroup";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/cn";

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
          <div className="space-y-2">
            {group.permissions.map((perm) => {
              const isOn = enabled.includes(perm);
              return (
                <div
                  key={perm}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-xl border px-3.5 py-3 transition-colors",
                    isOn
                      ? "border-accent/40 bg-accent/12"
                      : "border-line bg-surface-input",
                    disabled && "opacity-60",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-content text-sm font-semibold">
                      {PERMISSION_COPY[perm].label}
                    </p>
                    <p className="text-content-subtle mt-0.5 text-xs leading-relaxed">
                      {PERMISSION_COPY[perm].desc}
                    </p>
                  </div>
                  <Switch
                    checked={isOn}
                    label={PERMISSION_COPY[perm].label}
                    disabled={disabled}
                    onChange={(on) => onToggle(perm, on)}
                  />
                </div>
              );
            })}
          </div>
        </SettingsGroup>
      ))}
    </div>
  );
}
