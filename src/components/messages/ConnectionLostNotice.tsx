import { CHAT_OFFLINE_NOTICE_WEB } from "@discordia/client-shared";

/** Barra sobre el composer cuando se agotaron los reintentos de conexion. */
export function ConnectionLostNotice() {
  return (
    <p
      role="alert"
      className="bg-danger/10 text-danger shrink-0 px-4 py-1 text-center text-xs"
    >
      {CHAT_OFFLINE_NOTICE_WEB}
    </p>
  );
}
