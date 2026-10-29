"use client";

import {
  MAX_NAME,
  SERVER_NAME_LABEL,
  SERVER_NAME_PLACEHOLDER,
} from "@discordia/client-shared";

import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/cn";

interface ServerNameFieldProps {
  inputId: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
}

export function ServerNameField({
  inputId,
  value,
  error,
  onChange,
}: ServerNameFieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-content-subtle text-xs font-bold tracking-wider uppercase"
        >
          {SERVER_NAME_LABEL} <span className="text-danger">*</span>
        </label>
        <CharacterCounter length={value.length} max={MAX_NAME} />
      </div>

      <div
        className={cn(
          "bg-surface-input flex items-center rounded-xl border px-4 py-3 transition-colors",
          error ? "border-danger" : "border-line",
        )}
      >
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={SERVER_NAME_PLACEHOLDER}
          maxLength={MAX_NAME + 10}
          autoFocus
          className="text-content min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
        />
      </div>

      <FieldError message={error} />
    </div>
  );
}
