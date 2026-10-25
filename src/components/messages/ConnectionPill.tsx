"use client";

import {
  CHAT_OFFLINE_TITLE,
  CHAT_RECONNECTING_HINT,
  CHAT_RECONNECTING_NOTICE,
  CONNECTION_NOTICE_DELAY_MS,
  RETRY_LABEL,
  type ChatStatus,
} from "@discordia/client-shared";

import { CloudOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useRetryAction } from "@/hooks/useRetryAction";

import { FloatingPill, PILL_CLASS } from "./FloatingPill";

interface ConnectionPillProps {
  status: ChatStatus;
  /** Vuelve a conectar el chat; se ofrece cuando se agotaron los reintentos. */
  onRetry: () => void | Promise<unknown>;
}

/**
 * Globito flotante arriba del chat con el estado de la conexion. Va encima de los
 * mensajes, sin empujarlos. "Reconectando" espera un momento antes de aparecer:
 * un corte de un instante no debe parpadear.
 */
export function ConnectionPill({ status, onRetry }: ConnectionPillProps) {
  const isReconnecting = status === "reconnecting";
  const [hasWaited, setHasWaited] = useState(false);
  useEffect(() => {
    if (!isReconnecting) return;
    const timer = setTimeout(
      () => setHasWaited(true),
      CONNECTION_NOTICE_DELAY_MS,
    );
    return () => {
      clearTimeout(timer);
      setHasWaited(false);
    };
  }, [isReconnecting]);
  const { isRetrying, run } = useRetryAction(onRetry);

  let pill = null;
  if (status === "offline") {
    pill = (
      <div role="alert" className={`${PILL_CLASS} pointer-events-auto`}>
        <CloudOff size={14} className="shrink-0" aria-hidden />
        <span className="font-medium">{CHAT_OFFLINE_TITLE}</span>
        <button
          type="button"
          onClick={() => void run()}
          disabled={isRetrying}
          aria-busy={isRetrying}
          className="text-content-muted hover:text-content inline-flex shrink-0 cursor-pointer items-center gap-1.5 font-medium underline underline-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          {isRetrying ? (
            <Loader2
              size={12}
              className="motion-safe:animate-spin"
              aria-hidden
            />
          ) : null}
          {RETRY_LABEL}
        </button>
      </div>
    );
  } else if (isReconnecting && hasWaited) {
    pill = (
      <div role="status" className={PILL_CLASS}>
        <Loader2
          size={14}
          className="text-warning shrink-0 motion-safe:animate-spin"
          aria-hidden
        />
        <span className="font-medium">{CHAT_RECONNECTING_NOTICE}</span>
        <span className="text-content-muted hidden truncate sm:inline">
          {CHAT_RECONNECTING_HINT}
        </span>
      </div>
    );
  }

  if (!pill) return null;

  return <FloatingPill position="top">{pill}</FloatingPill>;
}
