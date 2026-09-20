import { type ActivityStatus } from "@discordia/client-shared";

import { ACTIVITY_STATUS_DOT_CLASS } from "./activity-status";
import { cn } from "@/lib/cn";

interface ActivityStatusDotProps {
  status: ActivityStatus;
  size?: number;
  /** Borde a juego con el fondo sobre el que se superpone (avatar, modal). */
  ringColor?: string;
  className?: string;
}

export function ActivityStatusDot({
  status,
  size = 14,
  ringColor,
  className,
}: ActivityStatusDotProps) {
  return (
    <span
      className={cn(
        "block rounded-full border-2",
        ACTIVITY_STATUS_DOT_CLASS[status],
        className,
      )}
      style={{
        width: size,
        height: size,
        borderColor: ringColor ?? "var(--bg-modal)",
      }}
      aria-hidden="true"
    />
  );
}
