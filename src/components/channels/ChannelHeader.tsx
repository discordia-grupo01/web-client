"use client";

import type { Channel } from "@discordia/client-shared";
import { MESSAGE_SEARCH_LABEL } from "@discordia/client-shared";
import { Bell, Eye, EyeOff, Hash, Search, Users, Volume2 } from "lucide-react";

import { MobileNavButton } from "@/components/layout/MobileNavButton";
import { useMessageSearchContext } from "@/contexts/MessageSearchContext";
import { MessageSearchInput } from "@/components/message-search/MessageSearchInput";
import { useMobilePanels } from "@/contexts/MobilePanelsContext";
import { IconButton } from "@/components/ui/IconButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";

interface ChannelHeaderProps {
  channel: Channel;
  /** El ojo solo aparece si hay banner que mostrar u ocultar. */
  hasBanner: boolean;
  isBannerVisible: boolean;
  onToggleBanner: () => void;
  isMembersVisible: boolean;
  onToggleMembers: () => void;
  voicePill?: { label: string; isLive: boolean } | null;
}

export function ChannelHeader({
  channel,
  hasBanner,
  isBannerVisible,
  onToggleBanner,
  isMembersVisible,
  onToggleMembers,
  voicePill = null,
}: ChannelHeaderProps) {
  const ChannelIcon = channel.kind === "text" ? Hash : Volume2;
  const { openMembers } = useMobilePanels();
  const search = useMessageSearchContext();
  const areMembersShown = isMembersVisible && !search.isOpen;

  return (
    <div className="border-line flex h-12 shrink-0 items-stretch border-b">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-2 md:px-4">
        <MobileNavButton />
        <ChannelIcon
          size={18}
          className={cn(
            "shrink-0",
            voicePill ? "text-success" : "text-content-subtle",
          )}
        />
        <span className="font-display text-content min-w-0 truncate text-sm font-semibold md:shrink-0">
          {channel.name}
        </span>

        {voicePill ? (
          <span
            className={cn(
              "ml-1 flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 md:ml-3",
              voicePill.isLive
                ? "bg-success/12 border-success/25 text-success"
                : "bg-highlight/12 border-highlight/25 text-highlight",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                voicePill.isLive ? "bg-success" : "bg-highlight animate-pulse",
              )}
            />
            <span className="text-xs font-medium whitespace-nowrap">
              {voicePill.label}
            </span>
          </span>
        ) : null}

        {channel.topic ? (
          <div className="hidden min-w-0 items-center gap-2 md:flex">
            <span className="bg-line-strong h-4 w-px shrink-0" />
            <span className="text-content-muted min-w-0 truncate text-xs">
              {channel.topic}
            </span>
          </div>
        ) : null}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {hasBanner ? (
            <IconButton
              icon={isBannerVisible ? Eye : EyeOff}
              label={isBannerVisible ? "Ocultar banner" : "Mostrar banner"}
              onClick={onToggleBanner}
              isPressed={isBannerVisible}
            />
          ) : null}

          <div className="hidden sm:flex">
            <IconButton icon={Bell} label="Notificaciones" disabled />
          </div>

          <div className="hidden lg:flex">
            <IconButton
              icon={Users}
              label={areMembersShown ? "Ocultar miembros" : "Mostrar miembros"}
              onClick={() => {
                if (search.isOpen) {
                  search.close();
                  if (!isMembersVisible) onToggleMembers();
                  return;
                }
                onToggleMembers();
              }}
              isActive={areMembersShown}
              isPressed={areMembersShown}
            />
          </div>
          <div className="flex lg:hidden">
            <IconButton
              icon={Users}
              label="Ver miembros"
              onClick={openMembers}
            />
          </div>

          {/* En pantallas angostas el campo vive en el drawer de busqueda. */}
          <div className="flex lg:hidden">
            <IconButton
              icon={Search}
              label={`${MESSAGE_SEARCH_LABEL} (Ctrl+K)`}
              onClick={search.isOpen ? search.close : search.open}
              isActive={search.isOpen}
              isPressed={search.isOpen}
            />
          </div>

          <ThemeToggle />
        </div>
      </div>

      {/* Mismo ancho que la columna de abajo (miembros o resultados): el campo
        queda justo arriba de lo que muestra. */}
      <div
        className={cn(
          "border-line hidden shrink-0 items-center border-l px-2 transition-[width] duration-200 lg:flex",
          search.isOpen ? "w-[400px]" : "w-60",
        )}
      >
        <MessageSearchInput />
      </div>
    </div>
  );
}
