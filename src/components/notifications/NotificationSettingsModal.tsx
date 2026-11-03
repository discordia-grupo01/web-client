"use client";

import {
  channelNotificationLevel,
  configuredChannelLevel,
  configuredServerLevel,
  isChannelMuted,
  isServerMuted,
  NOTIFICATION_LEVEL_DEFAULT_BADGE,
  NOTIFICATION_LEVEL_DESCRIPTIONS,
  NOTIFICATION_LEVEL_INHERITED_BADGE,
  NOTIFICATION_LEVEL_LABELS,
  NOTIFICATION_LEVELS,
  NOTIFICATION_SETTINGS_LEVEL_TITLE,
  NOTIFICATION_SETTINGS_MUTED_HINT,
  NOTIFICATION_SETTINGS_SERVER_MUTED_NOTE,
  type NotificationLevel,
  notificationLevelResetLabel,
  notificationMuteLabel,
  notificationSettingsChannelTitle,
  notificationSettingsServerTitle,
  serverNotificationLevel,
} from "@discordia/client-shared";

import { AlertCircle, Bell, BellOff, Check } from "lucide-react";
import { useState } from "react";

import { ModalShell } from "@/components/ui/ModalShell";
import { useOptionalNotificationSettings } from "@/contexts/NotificationSettingsContext";
import { cn } from "@/lib/cn";

interface NotificationSettingsModalProps {
  scope: "channel" | "server";
  targetId: string;
  serverId: string;
  name: string;
  onClose: () => void;
}

const TITLE_ID = "notification-settings-title";

export function NotificationSettingsModal({
  scope,
  targetId,
  serverId,
  name,
  onClose,
}: NotificationSettingsModalProps) {
  const notificationSettings = useOptionalNotificationSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!notificationSettings) return null;

  const { settings, setChannel, setServer } = notificationSettings;
  const isChannel = scope === "channel";
  const isMuted = isChannel
    ? isChannelMuted(settings, targetId)
    : isServerMuted(settings, targetId);
  const isServerSilenced = isChannel && isServerMuted(settings, serverId);
  const explicitLevel = isChannel
    ? channelNotificationLevel(settings, targetId)
    : serverNotificationLevel(settings, targetId);
  const configuredLevel = isChannel
    ? configuredChannelLevel(settings, serverId, targetId)
    : configuredServerLevel(settings, targetId);
  const followsParent = explicitLevel === null;
  const parentBadge = isChannel
    ? NOTIFICATION_LEVEL_INHERITED_BADGE
    : NOTIFICATION_LEVEL_DEFAULT_BADGE;
  const title = isChannel
    ? notificationSettingsChannelTitle(name)
    : notificationSettingsServerTitle(name);

  async function save(patch: {
    muted?: boolean;
    level?: NotificationLevel | null;
  }) {
    setIsSaving(true);
    setErrorMessage("");
    const result = isChannel
      ? await setChannel(targetId, patch)
      : await setServer(targetId, patch);
    setIsSaving(false);
    if (!result.ok) setErrorMessage(result.message);
  }

  return (
    <ModalShell onClose={onClose} labelledBy={TITLE_ID} maxWidth={440}>
      <div className="flex flex-col gap-5 px-7 py-7">
        <h2
          id={TITLE_ID}
          className="text-content pr-10 text-lg font-semibold break-words"
        >
          {title}
        </h2>

        {errorMessage ? (
          <div
            role="alert"
            className="border-danger/30 bg-danger/10 text-danger flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <div className="border-line bg-surface-input flex items-center gap-3 rounded-xl border px-4 py-3">
          {isMuted || isServerSilenced ? (
            <BellOff size={18} className="text-content-subtle shrink-0" />
          ) : (
            <Bell size={18} className="text-content-subtle shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-content text-sm font-medium">
              {notificationMuteLabel(scope, isMuted)}
            </p>
            <p className="text-content-subtle text-xs">
              {isServerSilenced
                ? NOTIFICATION_SETTINGS_SERVER_MUTED_NOTE
                : NOTIFICATION_SETTINGS_MUTED_HINT}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isMuted}
            aria-label={notificationMuteLabel(scope, isMuted)}
            disabled={isSaving}
            onClick={() => void save({ muted: !isMuted })}
            className={cn(
              "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              isMuted ? "bg-accent" : "bg-surface-hover",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
                isMuted && "translate-x-5",
              )}
            />
          </button>
        </div>

        <div role="radiogroup" aria-label={NOTIFICATION_SETTINGS_LEVEL_TITLE}>
          <p className="text-content-subtle mb-2 text-xs font-semibold tracking-wider uppercase">
            {NOTIFICATION_SETTINGS_LEVEL_TITLE}
          </p>
          <div className="border-line overflow-hidden rounded-xl border">
            {NOTIFICATION_LEVELS.map((level) => {
              const selected = level === configuredLevel;
              return (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={isSaving}
                  onClick={() => {
                    if (level !== explicitLevel) void save({ level });
                  }}
                  className="text-content hover:bg-surface-hover border-line flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {NOTIFICATION_LEVEL_LABELS[level]}
                      {selected && followsParent ? (
                        <span className="bg-surface-input text-content-subtle rounded-full px-2 py-0.5 text-[10px] font-semibold">
                          {parentBadge}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-content-subtle block text-xs">
                      {NOTIFICATION_LEVEL_DESCRIPTIONS[level]}
                    </span>
                  </span>
                  {selected ? (
                    <Check size={16} className="text-accent shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
          {followsParent ? null : (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void save({ level: null })}
              className="text-accent mt-2 cursor-pointer text-xs font-semibold hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {notificationLevelResetLabel(scope)}
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
