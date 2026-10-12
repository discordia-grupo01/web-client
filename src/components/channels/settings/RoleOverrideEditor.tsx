"use client";

import {
  type Channel,
  CHANNEL_PERMISSION_COPY,
  channelPermissionGroupsFor,
  type ChannelOverridePermission,
  CLEAR_ROLE_OVERRIDE_LABEL,
  OVERRIDE_ALLOW_LABEL,
  OVERRIDE_DENY_LABEL,
  OVERRIDE_INHERIT_LABEL,
  type OverrideValue,
  PERMISSION_NOT_HELD_HINT,
  type Role,
  ROLE_ABOVE_OWN_HINT,
  type RoleOverrideDraft,
} from "@discordia/client-shared";

import { Check, type LucideIcon, Slash, X } from "lucide-react";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { cn } from "@/lib/cn";

interface RoleOverrideEditorProps {
  role: Role;
  channelKind: Channel["kind"];
  values: RoleOverrideDraft | undefined;
  /** El actor no supera a este rol en la jerarquia. */
  disabled: boolean;
  canAllow: (permission: ChannelOverridePermission) => boolean;
  onChange: (
    permission: ChannelOverridePermission,
    value: OverrideValue,
  ) => void;
  onClear: () => void;
}

export function RoleOverrideEditor({
  role,
  channelKind,
  values,
  disabled,
  canAllow,
  onChange,
  onClear,
}: RoleOverrideEditorProps) {
  return (
    <div className="min-w-0 flex-1 p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="size-3 shrink-0 rounded-full"
            style={{ background: role.color }}
          />
          <h3 className="font-display text-content truncate font-bold">
            {role.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="text-content-muted cursor-pointer text-xs font-semibold underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          {CLEAR_ROLE_OVERRIDE_LABEL}
        </button>
      </div>

      {disabled ? (
        <p className="bg-surface-sunken text-content-muted mb-4 rounded-md px-3 py-2 text-xs">
          {ROLE_ABOVE_OWN_HINT}
        </p>
      ) : null}

      {channelPermissionGroupsFor(channelKind).map((group) => (
        <div key={group.title} className="mb-5 last:mb-0">
          <SectionLabel>{group.title}</SectionLabel>
          <div className="divide-line mt-1 divide-y">
            {group.permissions.map((permission) => (
              <PermissionOverrideRow
                key={permission}
                label={CHANNEL_PERMISSION_COPY[permission].label}
                description={CHANNEL_PERMISSION_COPY[permission].desc}
                value={values?.[permission] ?? "inherit"}
                disabled={disabled}
                canAllow={canAllow(permission)}
                onChange={(value) => onChange(permission, value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface OverrideOption {
  value: OverrideValue;
  label: string;
  icon: LucideIcon;
  activeClassName: string;
}

const OPTIONS: readonly OverrideOption[] = [
  {
    value: "deny",
    label: OVERRIDE_DENY_LABEL,
    icon: X,
    activeClassName: "bg-danger border-danger text-white",
  },
  {
    value: "inherit",
    label: OVERRIDE_INHERIT_LABEL,
    icon: Slash,
    activeClassName: "bg-surface-hover border-line-strong text-content",
  },
  {
    value: "allow",
    label: OVERRIDE_ALLOW_LABEL,
    icon: Check,
    activeClassName: "bg-success border-success text-white",
  },
];

interface PermissionOverrideRowProps {
  label: string;
  description: string;
  value: OverrideValue;
  /** El rol esta por encima del actor: se ve, pero no se puede tocar. */
  disabled: boolean;
  /** El actor no tiene el permiso: puede denegarlo pero no permitirlo. */
  canAllow: boolean;
  onChange: (value: OverrideValue) => void;
}

/** Un permiso del canal con los tres botones ✕ / ⧸ / ✓, como en Discord. */
function PermissionOverrideRow({
  label,
  description,
  value,
  disabled,
  canAllow,
  onChange,
}: PermissionOverrideRowProps) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-content text-sm font-semibold">{label}</p>
        <p className="text-content-subtle mt-0.5 text-xs">{description}</p>
      </div>
      <div role="group" aria-label={label} className="flex shrink-0">
        {OPTIONS.map((option, index) => {
          const isActive = value === option.value;
          const blockedAllow = option.value === "allow" && !canAllow;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled || blockedAllow}
              aria-pressed={isActive}
              aria-label={`${option.label}: ${label}`}
              title={blockedAllow ? PERMISSION_NOT_HELD_HINT : option.label}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex size-9 cursor-pointer items-center justify-center border transition-colors",
                "focus-visible:ring-accent focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-35",
                index === 0 && "rounded-l-md",
                index === OPTIONS.length - 1 && "rounded-r-md",
                index > 0 && "-ml-px",
                isActive
                  ? option.activeClassName
                  : "border-line-strong text-content-subtle hover:bg-surface-hover bg-transparent",
              )}
            >
              <Icon size={16} strokeWidth={2.5} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
