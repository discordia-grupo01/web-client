import type { ReactNode } from "react";

import { ServerAvatar } from "@/components/ui/server-avatar";
import { cn } from "@/lib/cn";

interface ProfileAvatarFrameProps {
  name: string;
  src?: string | null;
  size?: number;
  /** Si se pasa, el avatar es clickeable (perfil propio: abre el selector de archivo). */
  onClick?: () => void;
  ariaLabel?: string;
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
  className,
  children,
}: ProfileAvatarFrameProps) {
  const avatar = (
    <>
      <ServerAvatar
        name={name}
        src={src}
        size={size}
        className="rounded-full"
      />
      <span
        className="absolute inset-0 rounded-full border-4"
        style={{ borderColor: "var(--bg-modal)" }}
        aria-hidden="true"
      />
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
