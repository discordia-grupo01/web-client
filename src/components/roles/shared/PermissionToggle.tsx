"use client";

import { PERMISSION_COPY, type RolePermission } from "@discordia/client-shared";

import { cn } from "@/lib/cn";

interface PermissionToggleProps {
  perm: RolePermission;
  enabled: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

export function PermissionToggle({
  perm,
  enabled,
  disabled = false,
  onChange,
}: PermissionToggleProps) {
  const copy = PERMISSION_COPY[perm];
  return (
    <div
      onClick={() => {
        if (disabled) return;
        onChange(!enabled);
      }}
      aria-disabled={disabled}
      className={cn(
        "flex items-start justify-between gap-4 rounded-xl border px-4 py-3 transition-all",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        enabled
          ? "border-accent-strong bg-accent/10"
          : "bg-surface-input border-line",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-content text-sm font-semibold">{copy.label}</p>
        <p className="text-content-subtle mt-0.5 text-xs">{copy.desc}</p>
      </div>
      <div
        className={cn(
          "mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-all",
          enabled ? "bg-accent justify-end" : "bg-content-subtle justify-start",
        )}
      >
        <div className="bg-on-accent size-5 rounded-full shadow-sm" />
      </div>
    </div>
  );
}
