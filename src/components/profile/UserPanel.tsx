"use client";

import {
  type User,
  VOICE_MODERATOR_MUTED,
  VOICE_MUTE_LABEL,
  VOICE_UNMUTE_LABEL,
} from "@discordia/client-shared";

import { Bell, Headphones, Mic, MicOff, Settings } from "lucide-react";
import { useEffect, useState } from "react";

import { ActivityStatusDot } from "@/components/profile/ActivityStatusDot";
import { CountBadge } from "@/components/ui/CountBadge";
import {
  AccountSettingsModal,
  type AccountSettingsSection,
} from "@/components/settings/AccountSettingsModal";
import { Avatar } from "@/components/ui/Avatar";
import { VoiceConnectedStrip } from "@/components/voice/VoiceConnectedStrip";
import { cn } from "@/lib/cn";
import { usePresenceOf } from "@/hooks/usePresence";
import { ownAvatarSrc } from "@/utils/ownAvatar";
import { takeRequestedSettingsSection } from "@/utils/settingsRequest";
import { useOptionalNotifications } from "@/contexts/NotificationsContext";
import { useOptionalVoiceSession } from "@/contexts/VoiceSessionContext";

interface UserPanelProps {
  user: User;
  onClick: () => void;
}

export function UserPanel({ user, onClick }: UserPanelProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialSection, setInitialSection] =
    useState<AccountSettingsSection>();
  const voice = useOptionalVoiceSession();
  const notifications = useOptionalNotifications();
  const status = usePresenceOf(user.id);
  const isMuted = voice?.state.muted ?? false;
  const canSpeak = voice?.state.canSpeak ?? true;
  const micLabel = !canSpeak
    ? VOICE_MODERATOR_MUTED
    : isMuted
      ? VOICE_UNMUTE_LABEL
      : VOICE_MUTE_LABEL;

  useEffect(() => {
    const requested = takeRequestedSettingsSection();
    if (!requested) return;
    setInitialSection(requested);
    setIsSettingsOpen(true);
  }, []);

  function closeSettings() {
    setIsSettingsOpen(false);
    setInitialSection(undefined);
  }

  return (
    <>
      <VoiceConnectedStrip />
      <div
        className="flex w-full shrink-0 items-center gap-1 px-2 py-2"
        style={{
          background: "var(--bg-user-panel)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={onClick}
          className="hover:bg-surface-hover flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md py-1 pl-1 text-left transition-colors"
        >
          <div className="relative shrink-0">
            <Avatar
              name={user.name}
              src={ownAvatarSrc(user)}
              size={32}
              className="rounded-full"
            />
            <ActivityStatusDot
              status={status}
              size={11}
              ringColor="var(--bg-user-panel)"
              className="absolute right-0 bottom-0"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-content truncate text-sm leading-tight font-semibold">
              {user.name}
            </div>
            <div className="text-content-subtle truncate text-[11px]">
              Ver mi perfil
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          {notifications ? (
            <div ref={notifications.anchorRef} className="relative">
              <button
                type="button"
                title="Notificaciones"
                aria-label="Notificaciones"
                aria-expanded={notifications.isOpen}
                onClick={notifications.toggle}
                className={cn(
                  "flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors",
                  notifications.isOpen
                    ? "bg-surface-hover text-content"
                    : "text-content-muted hover:bg-surface-hover",
                )}
              >
                <Bell size={15} />
              </button>
              {notifications.unreadCount > 0 ? (
                <CountBadge
                  count={notifications.unreadCount}
                  label={`${notifications.unreadCount} notificaciones sin leer`}
                  className="pointer-events-none absolute -top-1 -right-1 h-4 min-w-4 text-[9px]"
                />
              ) : null}
            </div>
          ) : null}
          <button
            type="button"
            title={micLabel}
            aria-label={micLabel}
            aria-pressed={isMuted}
            onClick={voice?.toggleMute}
            disabled={!canSpeak}
            className={cn(
              "flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              isMuted
                ? "text-danger hover:bg-danger/10"
                : "text-content-muted hover:bg-surface-hover",
            )}
          >
            {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
          <button
            type="button"
            title="Silenciar audio"
            className="text-content-muted hover:bg-surface-hover flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors"
          >
            <Headphones size={15} />
          </button>
          <button
            type="button"
            title="Ajustes"
            onClick={() => setIsSettingsOpen(true)}
            className="text-content-muted hover:bg-surface-hover flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {isSettingsOpen ? (
        <AccountSettingsModal
          onClose={closeSettings}
          initialSection={initialSection}
        />
      ) : null}
    </>
  );
}
