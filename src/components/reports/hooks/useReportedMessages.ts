"use client";

import type { Message, Report } from "@discordia/client-shared";
import { useEffect, useMemo, useState } from "react";

import { lookupMessagesRequest } from "@/services/messages/client";

export type ReportedMessages =
  | { status: "loading" }
  | { status: "error"; message: string }
  /** `null`: el mensaje se borro o el moderador no ve su canal. */
  | { status: "ready"; byId: Record<string, Message | null> };

/**
 * Los mensajes de los reportes de la pagina. El reporte no trae texto ni
 * autor; `GET /v1/messages?ids=` los trae en un solo pedido y omite los
 * borrados o los de canales que no se ven.
 */
export function useReportedMessages(
  reports: Report[] | null,
): ReportedMessages {
  const ids = useMemo(
    () =>
      (reports ?? [])
        .map((report) => report.message_id)
        .filter((id): id is string => id !== null),
    [reports],
  );
  const key = ids.join(",");
  const [loaded, setLoaded] = useState<{
    key: string;
    result: ReportedMessages;
  } | null>(null);

  useEffect(() => {
    if (key === "") return;
    const requested = key.split(",");
    let cancelled = false;
    lookupMessagesRequest(requested).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setLoaded({
          key,
          result: { status: "error", message: result.message },
        });
        return;
      }
      const byId: Record<string, Message | null> = {};
      for (const id of requested) byId[id] = null;
      for (const message of result.messages) byId[message.id] = message;
      setLoaded({ key, result: { status: "ready", byId } });
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (key === "") return { status: "ready", byId: {} };
  return loaded?.key === key ? loaded.result : { status: "loading" };
}
