import { RETRY_LABEL } from "@discordia/client-shared";

import { Loader2 } from "lucide-react";

interface ChatStatusNoticeProps {
  message: string;
  /** Si viene, se muestra el boton "Reintentar" (errores que se pueden reintentar). */
  onRetry?: () => void;
  /** Muestra un spinner: se esta esperando al back (carga o reintento). */
  isLoading?: boolean;
}

/** Ocupa el lugar de la lista de mensajes cuando el canal no se puede mostrar. */
export function ChatStatusNotice({
  message,
  onRetry,
  isLoading = false,
}: ChatStatusNoticeProps) {
  return (
    <div
      role="status"
      className="text-content-muted flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm"
    >
      {isLoading ? (
        <Loader2 size={20} className="motion-safe:animate-spin" aria-hidden />
      ) : null}
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="bg-accent text-on-accent hover:bg-accent-strong cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium"
        >
          {RETRY_LABEL}
        </button>
      ) : null}
    </div>
  );
}
