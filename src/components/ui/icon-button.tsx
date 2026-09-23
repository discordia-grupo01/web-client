"use client";

import type { LucideIcon } from "lucide-react";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

interface IconButtonProps {
  icon: LucideIcon;
  /** Va como `aria-label` y como texto del tooltip. */
  label: string;
  onClick?: () => void;
  /** Resalta el boton cuando lo que controla esta activo. */
  isActive?: boolean;
  /** Sin accion todavia: se ve apagado y no responde. */
  disabled?: boolean;
  /** `true` cuando el boton muestra/oculta algo, para lectores de pantalla. */
  isPressed?: boolean;
}

/**
 * Boton de solo icono, con el nombre de la accion en un `Tooltip`. Tailwind
 * resetea el cursor de `<button>` a la flecha normal, asi que el
 * `cursor-pointer` va explicito.
 */
export function IconButton({
  icon: Icon,
  label,
  onClick,
  isActive = false,
  disabled = false,
  isPressed,
}: IconButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={isPressed}
        className={cn(
          "flex size-8 items-center justify-center rounded-lg transition-colors",
          "focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none",
          disabled
            ? "text-content-subtle cursor-not-allowed opacity-50"
            : "hover:bg-surface-hover cursor-pointer",
          !disabled && isActive
            ? "text-accent bg-accent/15"
            : "text-content-subtle hover:text-content",
        )}
      >
        <Icon size={18} />
      </button>
    </Tooltip>
  );
}
