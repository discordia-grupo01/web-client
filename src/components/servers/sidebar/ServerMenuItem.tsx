import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

interface ServerMenuItemProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  /** Acciones destructivas (abandonar el servidor). */
  variant?: "default" | "danger";
}

/** Una fila del menu desplegable del servidor: icono + texto. */
export function ServerMenuItem({
  icon: Icon,
  label,
  onClick,
  variant = "default",
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
      {label}
    </button>
  );
}
