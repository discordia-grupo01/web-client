"use client";

import type { Channel } from "@discordia/client-shared";
import { Bell, Eye, EyeOff, Hash, Users, Volume2 } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import { ChannelSearchBox } from "./channel-search-box";

interface ChannelHeaderProps {
  channel: Channel;
  /** El ojo solo aparece si hay banner que mostrar u ocultar. */
  hasBanner: boolean;
  isBannerVisible: boolean;
  onToggleBanner: () => void;
  isMembersVisible: boolean;
  onToggleMembers: () => void;
}

export function ChannelHeader({
  channel,
  hasBanner,
  isBannerVisible,
  onToggleBanner,
  isMembersVisible,
  onToggleMembers,
}: ChannelHeaderProps) {
  const ChannelIcon = channel.kind === "text" ? Hash : Volume2;

  return (
    <div className="border-line flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <ChannelIcon size={18} className="text-content-subtle shrink-0" />
      <span className="font-display text-content shrink-0 text-sm font-semibold">
        {channel.name}
      </span>

      {channel.topic ? (
        <>
          <span className="bg-line-strong h-4 w-px shrink-0" />
          <span className="text-content-muted min-w-0 truncate text-xs">
            {channel.topic}
          </span>
        </>
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

        <IconButton icon={Bell} label="Notificaciones" disabled />

        <IconButton
          icon={Users}
          label={isMembersVisible ? "Ocultar miembros" : "Mostrar miembros"}
          onClick={onToggleMembers}
          isActive={isMembersVisible}
          isPressed={isMembersVisible}
        />

        <ChannelSearchBox />

        <span className="bg-line-strong mx-1 h-5 w-px" />

        <ThemeToggle />
      </div>
    </div>
  );
}
