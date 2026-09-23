"use client";

import type { ServerSummary } from "@discordia/client-shared";
import { ChevronDown } from "lucide-react";

import { ServerAvatar } from "@/components/ui/server-avatar";
import { ServerBanner } from "@/components/ui/server-banner";
import { serverBannerSrc, serverIconSrc } from "@/services/servers/image-urls";
import { cn } from "@/lib/cn";

/** Igual que `BANNER_HEIGHT` en app-mobile, para que las dos se vean igual. */
const BANNER_HEIGHT = 88;

interface ServerHeaderTriggerProps {
  server: ServerSummary;
  isMenuOpen: boolean;
  onToggle: () => void;
}

/**
 * El boton que abre el menu del servidor.
 *
 * Con banner ocupa la franja entera y el nombre va abajo en blanco sobre un
 * velo oscuro (si no, un banner claro se come el texto). Sin banner cae a la
 * fila compacta de siempre, con el icono al lado del nombre.
 */
export function ServerHeaderTrigger({
  server,
  isMenuOpen,
  onToggle,
}: ServerHeaderTriggerProps) {
  const bannerSrc = serverBannerSrc(server);

  if (!bannerSrc) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isMenuOpen}
        className="hover:bg-surface-hover flex h-12 w-full cursor-pointer items-center gap-2 px-4 transition-colors"
      >
        <ServerAvatar
          name={server.name}
          src={serverIconSrc(server)}
          size={24}
          className="rounded-full"
        />
        <span className="font-display text-content min-w-0 flex-1 truncate text-left text-sm font-semibold">
          {server.name}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-content-subtle shrink-0 transition-transform",
            isMenuOpen && "rotate-180",
          )}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isMenuOpen}
      className="relative w-full cursor-pointer overflow-hidden"
      style={{ height: BANNER_HEIGHT }}
    >
      <ServerBanner src={bannerSrc} />

      <span
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <span className="absolute right-3.5 bottom-2.5 left-3.5 flex items-center gap-1.5">
        <span className="font-display min-w-0 flex-1 truncate text-left text-[15px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {server.name}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-white/85 transition-transform",
            isMenuOpen && "rotate-180",
          )}
        />
      </span>
    </button>
  );
}
