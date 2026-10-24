import {
  CHAT_OFFLINE_HINT,
  CHAT_OFFLINE_TITLE,
  RETRY_LABEL,
} from "@discordia/client-shared";
import { CloudOff, Loader2 } from "lucide-react";

import { useRetryAction } from "@/hooks/useRetryAction";

interface ConnectionLostNoticeProps {
  /** Vuelve a conectar sin recargar la pagina. */
  onRetry: () => void | Promise<unknown>;
}

/** Ocupa el lugar del chat cuando se agotaron los reintentos de conexion y nunca llego a cargar. */
export function ConnectionLostNotice({ onRetry }: ConnectionLostNoticeProps) {
  const { isRetrying, run } = useRetryAction(onRetry);

  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <div className="bg-surface-input flex size-14 items-center justify-center rounded-2xl">
        <CloudOff size={26} className="text-content" aria-hidden="true" />
      </div>
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-content text-sm font-medium">{CHAT_OFFLINE_TITLE}</p>
        <p className="text-content-muted text-xs">{CHAT_OFFLINE_HINT}</p>
      </div>
      <button
        type="button"
        onClick={() => void run()}
        disabled={isRetrying}
        aria-busy={isRetrying}
        className="bg-accent text-on-accent hover:bg-accent-strong inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium disabled:cursor-wait disabled:opacity-70"
      >
        {isRetrying ? (
          <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden />
        ) : null}
        {RETRY_LABEL}
      </button>
    </div>
  );
}
