import type { ReactNode } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

interface ProfileAvatarFrameProps {
  name: string;
  src?: string | null;
  size?: number;
  /** Si se pasa, el avatar es clickeable (perfil propio: abre el selector de archivo). */
  onClick?: () => void;
  ariaLabel?: string;
  /** Para cuando el click abre un menu en vez de una accion directa. */
  ariaHasPopup?: "menu";
  ariaExpanded?: boolean;
  className?: string;
  /** Contenido superpuesto al avatar (capa de "cambiar foto" o el punto de estado). */
  children?: ReactNode;
}

/**
 * Avatar superpuesto a la portada (margen negativo) con anillo a juego con
 * el fondo del modal. Compartido por perfil propio y perfil público.
 */
export function ProfileAvatarFrame({
  name,
  src,
  size = 80,
  onClick,
  ariaLabel,
  ariaHasPopup,
  ariaExpanded,
  className,
  children,
}: ProfileAvatarFrameProps) {
  const avatar = (
    <>
      <span
        className="block rounded-full p-1"
        style={{ backgroundColor: "var(--bg-modal)" }}
      >
        <Avatar
          name={name}
          src={src}
          size={size - 8}
          className="rounded-full"
        />
      </span>
      {children}
    </>
  );

  return (
    <div className="relative px-6" style={{ marginTop: -32 }}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label={ariaLabel}
          aria-haspopup={ariaHasPopup}
          aria-expanded={ariaExpanded}
          className={cn(
            "group relative inline-block cursor-pointer rounded-full",
            className,
          )}
        >
          {avatar}
        </button>
      ) : (
        <div className={cn("relative inline-block rounded-full", className)}>
          {avatar}
        </div>
      )}
    </div>
  );
}
