"use client";

import type { Channel } from "@discordia/client-shared";
import { Bell, Eye, EyeOff, Hash, Users, Volume2 } from "lucide-react";

import { MobileNavButton } from "@/components/layout/MobileNavButton";
import { useMobilePanels } from "@/components/layout/MobilePanelsContext";
import { IconButton } from "@/components/ui/IconButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";

import { ChannelSearchBox } from "./ChannelSearchBox";

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

  return (
    <div className="border-line flex h-12 shrink-0 items-center gap-2 border-b px-2 md:px-4">
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

        {/* En desktop muestra/oculta la columna; en mobile abre el drawer. */}
        <div className="hidden md:flex">
          <IconButton
            icon={Users}
            label={isMembersVisible ? "Ocultar miembros" : "Mostrar miembros"}
            onClick={onToggleMembers}
            isActive={isMembersVisible}
            isPressed={isMembersVisible}
          />
        </div>
        <div className="flex md:hidden">
          <IconButton icon={Users} label="Ver miembros" onClick={openMembers} />
        </div>

        <div className="hidden items-center lg:flex">
          <ChannelSearchBox />
          <span className="bg-line-strong mx-2 h-5 w-px" />
        </div>

        <ThemeToggle />
      </div>
    </div>
  );
}
