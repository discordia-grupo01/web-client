"use client";

import { getInitial } from "@discordia/client-shared";

import { useState } from "react";

import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  /**
   * URL de un ícono real. Si es `null`/`undefined`, o si la imagen no carga
   * (404, archivo borrado del storage...), se muestra el degradado con la
   * inicial en vez del ícono de "imagen rota" del navegador.
   */
  src?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, src, size = 48, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const [lastSrc, setLastSrc] = useState(src);
  if (src !== lastSrc) {
    setLastSrc(src);
    setFailed(false);
  }

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className={cn("object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const initial = getInitial(name) ?? "?";

  return (
    <div
      className={cn(
        "from-accent-gradient-start font-display to-accent-gradient-end text-on-accent flex shrink-0 items-center justify-center bg-gradient-to-br font-bold select-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}
