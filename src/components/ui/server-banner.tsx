"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";

interface ServerBannerProps {
  /** Imagen del banner. `null` cuando el servidor no tiene. */
  src?: string | null;
  /**
   * Degradado CSS que reemplaza a la imagen. Lo usa la preview de un fondo
   * fijo: se dibuja el degradado en vez del PNG chiquito del preset, que
   * estirado a todo el ancho se ve con bandas.
   */
  gradient?: string | null;
  className?: string;
}

/**
 * Banner del servidor. No renderiza nada cuando no hay imagen ni degradado:
 * quien lo usa decide que poner en ese hueco (el header del sidebar cae a su
 * fila compacta, el editor muestra el placeholder de "Agregar banner").
 */
export function ServerBanner({ src, gradient, className }: ServerBannerProps) {
  // Una imagen que ya fallo no se reintenta; se guarda la url y no un
  // booleano para que un banner nuevo (otro `?v=`) vuelva a intentarlo.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (gradient) {
    return (
      <div
        className={cn("size-full", className)}
        style={{ background: gradient }}
      />
    );
  }

  if (!src || src === failedSrc) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setFailedSrc(src)}
      className={cn("size-full object-cover", className)}
    />
  );
}
