"use client";

import {
  formatMessageTimestamp,
  MODERATION_AUDIT_ACTIONS,
  type ModerationAuditAction,
  type ModerationAuditEntry,
} from "@discordia/client-shared";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { avatarSrcOf, displayNameOf } from "@/utils/userProfile";

const CHIP_TONES: Record<ModerationAuditAction, string> = {
  ban: "bg-danger/15 text-danger",
  kick: "bg-warning/15 text-warning",
  mute: "bg-info/15 text-info",
  unban: "bg-success/15 text-success",
  unmute: "bg-success/15 text-success",
};

export function AuditEntryRow({ entry }: { entry: ModerationAuditEntry }) {
  const actorName = displayNameOf(entry.actor_profile);
  const { verb, label } = MODERATION_AUDIT_ACTIONS[entry.action];

  return (
    <article className="border-line bg-surface flex items-center gap-3 rounded-xl border p-4">
      <Avatar
        name={actorName}
        src={avatarSrcOf(entry.actor_user_id, entry.actor_profile)}
        size={36}
        className="shrink-0 rounded-full"
      />
      <p className="text-content-muted min-w-0 flex-1 text-sm break-words">
        <span className="text-content font-semibold">{actorName}</span> {verb}{" "}
        <span className="text-content font-semibold">
          {displayNameOf(entry.target_profile)}
        </span>
      </p>
      <div className="flex shrink-0 flex-col items-end gap-1.5 text-xs">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-bold",
            CHIP_TONES[entry.action],
          )}
        >
          {label}
        </span>
        <time dateTime={entry.occurred_at} className="text-content-subtle">
          {formatMessageTimestamp(entry.occurred_at)}
        </time>
      </div>
    </article>
  );
}
