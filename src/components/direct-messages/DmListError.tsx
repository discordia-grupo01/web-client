import { CHAT_OFFLINE_TITLE, RETRY_LABEL } from "@discordia/client-shared";

import { CircleAlert, CloudOff, Loader2 } from "lucide-react";

import { useRetryAction } from "@/hooks/useRetryAction";

interface DmListErrorProps {
  /** Texto del error cuando no es por falta de conexion. */
  message: string;
  isOffline: boolean;
  onRetry: () => void | Promise<unknown>;
}

const RETRY_CLASS =
  "text-content hover:text-content-muted inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-medium underline underline-offset-2 disabled:cursor-wait disabled:opacity-70";

/**
 * Lugar de la lista de conversaciones cuando no se pudo cargar. Sin conexion es
 * una sola linea y sin botones: el panel del chat ya explica el corte y es donde
 * se reintenta.
 */
export function DmListError({ message, isOffline, onRetry }: DmListErrorProps) {
  const { isRetrying, run } = useRetryAction(onRetry);

  if (isOffline) {
    return (
      <div role="alert" className="flex items-center gap-2 px-2 py-2">
        <CloudOff
          size={16}
          className="text-content-muted shrink-0"
          aria-hidden
        />
        <p className="text-content-muted min-w-0 flex-1 truncate text-xs">
          {CHAT_OFFLINE_TITLE}
        </p>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 px-4 py-6 text-center"
    >
      <div className="bg-surface-input flex size-11 items-center justify-center rounded-xl">
        <CircleAlert size={20} className="text-danger" aria-hidden />
      </div>
      <p className="text-content text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={() => void run()}
        disabled={isRetrying}
        aria-busy={isRetrying}
        className={RETRY_CLASS}
      >
        {isRetrying ? (
          <Loader2 size={12} className="motion-safe:animate-spin" aria-hidden />
        ) : null}
        {RETRY_LABEL}
      </button>
    </div>
  );
}
