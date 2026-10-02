import { RETRY_LABEL } from "@discordia/client-shared";

interface ChatStatusNoticeProps {
  message: string;
  /** Si viene, se muestra el boton "Reintentar" (errores que se pueden reintentar). */
  onRetry?: () => void;
}

/** Ocupa el lugar de la lista de mensajes cuando el canal no se puede mostrar. */
export function ChatStatusNotice({ message, onRetry }: ChatStatusNoticeProps) {
  return (
    <div
      role="status"
      className="text-content-muted flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm"
    >
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
