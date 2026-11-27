import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SettingsGroupProps {
  label: ReactNode;
  hint?: ReactNode;
  count?: number | string;
  aside?: ReactNode;
  /** En celular el `aside` va arriba, a todo el ancho (un botón de acción, no un contador). */
  isAsideStackedOnMobile?: boolean;
  children: ReactNode;
}

export function SettingsGroup({
  label,
  hint,
  count,
  aside,
  isAsideStackedOnMobile = false,
  children,
}: SettingsGroupProps) {
  return (
    <section className="space-y-3">
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          isAsideStackedOnMobile &&
            "flex-col-reverse items-stretch sm:flex-row sm:items-center",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-content font-display text-sm font-semibold">
            {label}
          </h3>
          {count !== undefined ? (
            <span className="bg-surface-input text-content-muted rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums">
              {count}
            </span>
          ) : null}
        </div>
        {aside}
      </div>
      {hint ? (
        <p className="text-content-subtle -mt-1 text-xs leading-relaxed">
          {hint}
        </p>
      ) : null}
      {children}
    </section>
  );
}
