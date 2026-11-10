"use client";

import {
  type ClosedReportStatus,
  type Message,
  type MessageAuthor,
  type Report,
  REPORT_AUTO_RESOLVE_PENDING,
  type ReportSanction,
  reportSanctionNotice,
} from "@discordia/client-shared";
import { useState } from "react";

import type { BanTarget } from "@/components/bans/BanMemberModal";
import { deleteMessageRequest } from "@/services/messages/client";

import type { CloseOutcome } from "./useReportsList";

export type ActiveSanction =
  | {
      sanction: "delete";
      report: Report;
      message: Message;
      author: MessageAuthor;
    }
  | {
      sanction: Exclude<ReportSanction, "delete">;
      report: Report;
      target: BanTarget;
    };

export interface ReportNotice {
  tone: "success" | "error";
  text: string;
}

/**
 * Sancionar desde un reporte con los modales de siempre y, si sale bien,
 * marcarlo como resuelto. Si la sancion falla el reporte no se toca; si falla
 * solo el `PATCH`, la sancion queda aplicada y se avisa para resolverlo a mano.
 */
export function useReportAction(
  close: (
    reportId: string,
    status: ClosedReportStatus,
  ) => Promise<CloseOutcome>,
) {
  const [active, setActive] = useState<ActiveSanction | null>(null);
  const [notice, setNotice] = useState<ReportNotice | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  async function resolveAfter(
    sanction: ReportSanction,
    report: Report,
    name: string,
  ) {
    const outcome = await close(report.id, "resolved");
    setNotice(
      outcome.ok
        ? { tone: "success", text: reportSanctionNotice(sanction, name) }
        : { tone: "error", text: REPORT_AUTO_RESOLVE_PENDING },
    );
  }

  function start(next: ActiveSanction) {
    setNotice(null);
    setActive(next);
  }

  /** Lo llaman `onMuted` / `onKicked` / `onBanned`: el modal sigue abierto. */
  function sanctionApplied() {
    if (!active || active.sanction === "delete") return;
    void resolveAfter(active.sanction, active.report, active.target.name);
  }

  async function confirmDelete() {
    if (!active || active.sanction !== "delete") return;
    const { report, message, author } = active;
    setActive(null);
    const result = await deleteMessageRequest(message.channel_id, message.id);
    if (!result.ok) {
      setNotice({ tone: "error", text: result.message });
      return;
    }
    await resolveAfter("delete", report, author.name);
  }

  async function closeManually(report: Report, status: ClosedReportStatus) {
    setNotice(null);
    setClosingId(report.id);
    const outcome = await close(report.id, status);
    setClosingId(null);
    if (!outcome.ok) setNotice({ tone: "error", text: outcome.message });
    else if (outcome.alreadyClosed)
      setNotice({ tone: "error", text: outcome.message });
  }

  return {
    active,
    notice,
    closingId,
    start,
    cancel: () => setActive(null),
    sanctionApplied,
    confirmDelete,
    closeManually,
    dismissNotice: () => setNotice(null),
  };
}
