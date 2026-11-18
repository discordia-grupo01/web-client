import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { BoostActionIcon } from "@/components/boosts/icons/BoostActionIcon";

import { cn } from "@/lib/cn";

interface ServerMenuItemProps {
  icon: LucideIcon | typeof BoostActionIcon;
  label: string;
  description?: string;
  onClick: () => void;
  /** Acciones destructivas (abandonar el servidor). */
  variant?: "default" | "danger";
  /** Indicador al final de la fila (reportes pendientes). */
  trailing?: ReactNode;
}

/** Una fila del menu desplegable del servidor: icono + texto (+ descripción opcional). */
export function ServerMenuItem({
  icon: Icon,
  label,
  description,
  onClick,
  variant = "default",
  trailing,
}: ServerMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors",
        variant === "danger"
          ? "text-danger hover:bg-danger/10"
          : "text-content hover:bg-surface-hover",
      )}
    >
      <Icon size={14} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{label}</span>
        {description ? (
          <span className="text-content-subtle block truncate text-[11px] leading-tight">
            {description}
          </span>
        ) : null}
      </span>
      {trailing}
    </button>
  );
}
