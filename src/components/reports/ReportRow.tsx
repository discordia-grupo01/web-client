"use client";

import {
  DISMISS_REPORT_ACTION,
  GO_TO_REPORTED_MESSAGE_ACTION,
  type Message,
  type MessageAuthor,
  parseReportReason,
  type Report,
  REPORTED_MESSAGE_GONE,
  REPORTED_MESSAGE_UNKNOWN_CHANNEL,
  reportedMessageIn,
  type ReportSanction,
  RESOLVE_REPORT_ACTION,
} from "@discordia/client-shared";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { ReportRowHeading } from "./ReportRowHeading";
import { ReportSanctionMenu } from "./ReportSanctionMenu";
import { ReportTargetPreview } from "./ReportTargetPreview";

export type ReportedMessageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "gone" }
  | { status: "ready"; message: Message; author: MessageAuthor };

interface ReportRowProps {
  report: Report;
  /** Solo en reportes de mensaje. */
  reportedMessage: ReportedMessageState | null;
  channelName: string | null;
  sanctions: readonly ReportSanction[];
  isClosing: boolean;
  onGoToMessage?: () => void;
  onOpenProfile?: () => void;
  onSanction: (sanction: ReportSanction) => void;
  onResolve: () => void;
  onDismiss: () => void;
}

const SMALL_BUTTON =
  "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function ReportRow({
  report,
  reportedMessage,
  channelName,
  sanctions,
  isClosing,
  onGoToMessage,
  onOpenProfile,
  onSanction,
  onResolve,
  onDismiss,
}: ReportRowProps) {
  const { detail } = parseReportReason(report.reason);
  const isPending = report.status === "pending";

  return (
    <article className="border-line bg-surface space-y-3 rounded-xl border p-4">
      <ReportRowHeading report={report} onOpenProfile={onOpenProfile} />

      {detail ? (
        <p className="border-line text-content-muted border-l-2 pl-3 text-sm break-words whitespace-pre-wrap">
          {detail}
        </p>
      ) : null}

      {report.kind === "message" ? (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-x-3">
            <p className="text-content-muted text-xs font-semibold">
              {channelName
                ? reportedMessageIn(channelName)
                : REPORTED_MESSAGE_UNKNOWN_CHANNEL}
            </p>
            {onGoToMessage ? (
              <button
                type="button"
                onClick={onGoToMessage}
                className="text-accent-strong flex cursor-pointer items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80"
              >
                <ArrowUpRight size={14} aria-hidden="true" />
                {GO_TO_REPORTED_MESSAGE_ACTION}
              </button>
            ) : null}
          </div>
          <ReportedMessage
            state={reportedMessage}
            onOpenProfile={onOpenProfile}
          />
        </div>
      ) : null}

      {isPending ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <ReportSanctionMenu available={sanctions} onChoose={onSanction} />
          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={onDismiss}
              disabled={isClosing}
              className={cn(
                SMALL_BUTTON,
                "border-line text-content-muted hover:border-line-strong hover:text-content flex-1 justify-center border py-2 sm:flex-none sm:py-1.5",
              )}
            >
              {DISMISS_REPORT_ACTION}
            </button>
            <button
              type="button"
              onClick={onResolve}
              disabled={isClosing}
              className={cn(
                SMALL_BUTTON,
                "bg-accent text-on-accent hover:bg-accent-strong flex-1 justify-center py-2 sm:flex-none sm:py-1.5",
              )}
            >
              {RESOLVE_REPORT_ACTION}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ReportedMessage({
  state,
  onOpenProfile,
}: {
  state: ReportedMessageState | null;
  onOpenProfile?: () => void;
}) {
  if (!state || state.status === "loading") {
    return <LoadingSpinner label="Cargando mensaje" />;
  }
  if (state.status === "error" || state.status === "gone") {
    return (
      <p className="border-line text-content-subtle rounded-xl border border-dashed px-3 py-2.5 text-sm">
        {state.status === "gone" ? REPORTED_MESSAGE_GONE : state.message}
      </p>
    );
  }
  return (
    <ReportTargetPreview
      kind="message"
      message={state.message}
      author={state.author}
      onOpenProfile={onOpenProfile}
    />
  );
}
