import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SettingsRowProps {
  label: ReactNode;
  hint?: ReactNode;
  control: ReactNode;
  disabled?: boolean;
}

export function SettingsRow({
  label,
  hint,
  control,
  disabled,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        "border-line flex items-center justify-between gap-4 border-b py-3 last:border-b-0",
        disabled && "opacity-60",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-content text-sm font-medium">{label}</p>
        {hint ? (
          <p className="text-content-subtle mt-0.5 text-xs leading-relaxed">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
