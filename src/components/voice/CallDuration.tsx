"use client";

import {
  formatCallDuration,
  VOICE_CALL_DURATION_LABEL,
} from "@discordia/client-shared";

import { useNow } from "@/components/voice/hooks/useNow";
import { cn } from "@/lib/cn";

/**
 * Hace cuanto empezo la llamada, avanzando cada segundo. Sin `aria-live`: un
 * lector de pantalla lo lee al llegar, no lo anuncia cada segundo.
 */
export function CallDuration({
  startedAt,
  className,
}: {
  startedAt: number;
  className?: string;
}) {
  const now = useNow();
  if (now === null) return null;

  const duration = formatCallDuration(now - startedAt);
  return (
    <time
      dateTime={new Date(startedAt).toISOString()}
      title={VOICE_CALL_DURATION_LABEL}
      aria-label={`${VOICE_CALL_DURATION_LABEL}: ${duration}`}
      className={cn("shrink-0 tabular-nums", className)}
    >
      {duration}
    </time>
  );
}
