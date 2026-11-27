"use client";

import {
  type ClosedReportStatus,
  type Message,
  type MessageAuthor,
  type Report,
  REPORT_AUTO_RESOLVE_PENDING,
  REPORT_DISMISSED_NOTICE,
  REPORT_RESOLVED_NOTICE,
  type ReportResolutionAction,
  type ReportSanction,
  reportSanctionNotice,
  resolutionActionFor,
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

/**
 * Sancionar desde un reporte con los modales de siempre y, si sale bien,
 * marcarlo como resuelto. Si la sancion falla el reporte no se toca; si falla
 * solo el `PATCH`, la sancion queda aplicada y se avisa para resolverlo a mano.
 */
export function useReportAction(
  close: (
    reportId: string,
    status: ClosedReportStatus,
    action?: ReportResolutionAction | null,
  ) => Promise<CloseOutcome>,
  onSuccess: (message: string) => void,
) {
  const [active, setActive] = useState<ActiveSanction | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [closingId, setClosingId] = useState<string | null>(null);

  async function resolveAfter(
    sanction: ReportSanction,
    report: Report,
    name: string,
  ) {
    const outcome = await close(
      report.id,
      "resolved",
      resolutionActionFor(sanction),
    );
    if (outcome.ok) onSuccess(reportSanctionNotice(sanction, name));
    else setErrorMessage(REPORT_AUTO_RESOLVE_PENDING);
  }

  function start(next: ActiveSanction) {
    setErrorMessage("");
    setActive(next);
  }

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
      setErrorMessage(result.message);
      return;
    }
    await resolveAfter("delete", report, author.name);
  }

  async function closeManually(report: Report, status: ClosedReportStatus) {
    setErrorMessage("");
    setClosingId(report.id);
    const outcome = await close(report.id, status);
    setClosingId(null);
    if (!outcome.ok || outcome.alreadyClosed) {
      setErrorMessage(outcome.message);
      return;
    }
    onSuccess(
      status === "resolved" ? REPORT_RESOLVED_NOTICE : REPORT_DISMISSED_NOTICE,
    );
  }

  return {
    active,
    errorMessage,
    closingId,
    start,
    cancel: () => setActive(null),
    sanctionApplied,
    confirmDelete,
    closeManually,
  };
}
