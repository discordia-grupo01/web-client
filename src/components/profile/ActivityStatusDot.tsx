import { type ActivityStatus } from "@discordia/client-shared";

import { ACTIVITY_STATUS_DOT_CLASS } from "./activityStatus";
import { cn } from "@/lib/cn";

interface ActivityStatusDotProps {
  status: ActivityStatus;
  size?: number;
  /** Grosor del anillo en px; el diámetro `size` lo incluye. */
  ringWidth?: number;
  /** Borde a juego con el fondo sobre el que se superpone (avatar, modal). */
  ringColor?: string;
  className?: string;
}

export function ActivityStatusDot({
  status,
  size = 14,
  ringWidth = 2,
  ringColor,
  className,
}: ActivityStatusDotProps) {
  return (
    <span
      className={cn(
        "block rounded-full border-solid",
        ACTIVITY_STATUS_DOT_CLASS[status],
        className,
      )}
      style={{
        width: size,
        height: size,
        borderWidth: ringWidth,
        borderColor: ringColor ?? "var(--bg-modal)",
      }}
      aria-hidden="true"
    />
  );
}
