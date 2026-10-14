import {
  CHAT_OFFLINE_BAR_WEB,
  CHAT_OFFLINE_HINT_WEB,
  CHAT_OFFLINE_TITLE,
} from "@discordia/client-shared";
import { WifiOff } from "lucide-react";

interface ConnectionLostNoticeProps {
  variant: "panel" | "bar";
}

/** Aviso de que se agotaron los reintentos de conexion del chat. */
export function ConnectionLostNotice({ variant }: ConnectionLostNoticeProps) {
  if (variant === "bar") {
    return (
      <p
        role="alert"
        className="bg-danger/10 text-danger flex shrink-0 items-center justify-center gap-2 px-4 py-1 text-xs"
      >
        <WifiOff size={13} aria-hidden="true" />
        {CHAT_OFFLINE_BAR_WEB}
      </p>
    );
  }
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <div className="bg-danger/10 flex size-14 items-center justify-center rounded-2xl">
        <WifiOff size={26} className="text-danger" aria-hidden="true" />
      </div>
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-content text-sm font-medium">{CHAT_OFFLINE_TITLE}</p>
        <p className="text-content-muted text-xs">{CHAT_OFFLINE_HINT_WEB}</p>
      </div>
    </div>
  );
}
