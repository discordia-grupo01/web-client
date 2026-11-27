"use client";

import { MAX_NAME } from "@discordia/client-shared";

import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { SettingsGroup } from "@/components/ui/settings/SettingsGroup";
import { cn } from "@/lib/cn";

import { FieldError } from "./ColorPicker";
import { RolePreviewBadge } from "./RolePreviewBadge";
import { FieldLabel } from "@/components/ui/FieldLabel";

interface RoleNameFieldProps {
  inputId: string;
  value: string;
  color: string;
  error?: string;
  disabled?: boolean;
  hint?: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}

export function RoleNameField({
  inputId,
  value,
  color,
  error,
  disabled = false,
  hint,
  autoFocus,
  onChange,
}: RoleNameFieldProps) {
  return (
    <SettingsGroup
      label={
        <FieldLabel htmlFor={inputId} required>
          Nombre
        </FieldLabel>
      }
      aside={<CharacterCounter length={value.length} max={MAX_NAME} />}
    >
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nombre del rol"
        autoFocus={autoFocus}
        maxLength={MAX_NAME + 10}
        disabled={disabled}
        readOnly={disabled}
        aria-invalid={error ? true : undefined}
        className={cn(
          "bg-surface-input text-content focus:border-accent w-full rounded-xl border px-4 py-3 text-sm transition-colors outline-none",
          error ? "border-danger" : "border-line",
          disabled && "cursor-not-allowed opacity-70",
        )}
      />
      <FieldError message={error} />
      <RolePreviewBadge name={value} color={color} />
      {hint ? <p className="text-content-subtle text-xs">{hint}</p> : null}
    </SettingsGroup>
  );
}
