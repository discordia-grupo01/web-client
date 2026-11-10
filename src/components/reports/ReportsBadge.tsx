import { Flag } from "lucide-react";

import { cn } from "@/lib/cn";

interface ReportsBadgeProps {
  /** Texto para lectores de pantalla ("3 reportes pendientes en Facultad"). */
  label: string;
  /** Sin `count` es solo la bandera (riel y menu); con `count`, bandera y numero. */
  count?: number;
  className?: string;
}

/**
 * Reportes pendientes: bandera en el color de advertencia. Se distingue del
 * contador rojo de menciones por forma, color y posicion.
 */
export function ReportsBadge({ label, count, className }: ReportsBadgeProps) {
  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className={cn(
        "bg-warning text-on-accent flex h-[18px] min-w-[18px] shrink-0 items-center justify-center gap-0.5 rounded-full text-[10px] font-bold",
        count === undefined ? "w-[18px]" : "px-1.5",
        className,
      )}
    >
      <Flag size={10} strokeWidth={2.75} aria-hidden="true" />
      {count === undefined ? null : count > 99 ? "99+" : count}
    </span>
  );
}
