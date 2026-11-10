"use client";

import {
  DISMISS_REPORT_ACTION,
  formatMessageTimestamp,
  GO_TO_REPORTED_MESSAGE_ACTION,
  type Message,
  type MessageAuthor,
  parseReportReason,
  type Report,
  REPORT_DISMISSED_BADGE,
  REPORTED_MESSAGE_GONE,
  REPORTED_MESSAGE_UNKNOWN_CHANNEL,
  reportedByLabel,
  reportedMessageIn,
  reportResolvedLabel,
  type ReportSanction,
  RESOLVE_REPORT_ACTION,
  VIEW_PROFILE_LABEL,
} from "@discordia/client-shared";
import { ArrowUpRight, Flag, UserRound } from "lucide-react";

import { cn } from "@/lib/cn";
import { avatarSrcOf, displayNameOf } from "@/utils/userProfile";

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
  onViewProfile?: () => void;
  onSanction: (sanction: ReportSanction) => void;
  onResolve: () => void;
  onDismiss: () => void;
}

const SMALL_BUTTON =
  "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

/** Ir al mensaje / Ver perfil: llevan a otro lado, no cierran el reporte. */
const LINK_BUTTON =
  "border-accent-strong/50 bg-accent/10 text-content hover:bg-accent/20 border";

export function ReportRow({
  report,
  reportedMessage,
  channelName,
  sanctions,
  isClosing,
  onGoToMessage,
  onViewProfile,
  onSanction,
  onResolve,
  onDismiss,
}: ReportRowProps) {
  const { category, detail } = parseReportReason(report.reason);
  const isPending = report.status === "pending";
  const hasFooter =
    isPending || onGoToMessage !== undefined || onViewProfile !== undefined;

  return (
    <article className="border-line bg-surface space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {category ? (
          <span className="bg-warning/15 text-warning flex items-center gap-1 rounded-full px-2 py-0.5 font-bold">
            <Flag size={11} aria-hidden="true" />
            {category.label}
          </span>
        ) : null}
        {!isPending ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-bold",
              report.status === "resolved"
                ? "bg-success/15 text-success"
                : "bg-surface-input text-content-muted",
            )}
          >
            {report.status === "resolved"
              ? reportResolvedLabel(report.resolution_action)
              : REPORT_DISMISSED_BADGE}
          </span>
        ) : null}
        <span className="text-content-subtle">
          {reportedByLabel(displayNameOf(report.reporter_profile))} ·{" "}
          {formatMessageTimestamp(report.resolved_at ?? report.created_at)}
        </span>
      </div>

      {detail ? (
        <p className="text-content text-sm break-words whitespace-pre-wrap">
          {detail}
        </p>
      ) : null}

      {report.kind === "message" ? (
        <div className="space-y-1.5">
          <p className="text-content-muted text-xs font-semibold">
            {channelName
              ? reportedMessageIn(channelName)
              : REPORTED_MESSAGE_UNKNOWN_CHANNEL}
          </p>
          <ReportedMessage state={reportedMessage} />
        </div>
      ) : (
        <ReportTargetPreview
          kind="user"
          name={displayNameOf(report.reported_profile)}
          avatarSrc={
            report.reported_user_id
              ? avatarSrcOf(report.reported_user_id, report.reported_profile)
              : null
          }
        />
      )}

      {hasFooter ? (
        <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {onGoToMessage ? (
              <button
                type="button"
                onClick={onGoToMessage}
                className={cn(SMALL_BUTTON, LINK_BUTTON)}
              >
                <ArrowUpRight
                  size={14}
                  aria-hidden="true"
                  className="text-accent-strong"
                />
                {GO_TO_REPORTED_MESSAGE_ACTION}
              </button>
            ) : null}
            {onViewProfile ? (
              <button
                type="button"
                onClick={onViewProfile}
                className={cn(SMALL_BUTTON, LINK_BUTTON)}
              >
                <UserRound
                  size={14}
                  aria-hidden="true"
                  className="text-accent-strong"
                />
                {VIEW_PROFILE_LABEL}
              </button>
            ) : null}
            {isPending ? (
              <ReportSanctionMenu available={sanctions} onChoose={onSanction} />
            ) : null}
          </div>
          {isPending ? (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onDismiss}
                disabled={isClosing}
                className={cn(
                  SMALL_BUTTON,
                  "border-line text-content-muted hover:border-line-strong hover:text-content border",
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
                  "bg-accent text-on-accent hover:bg-accent-strong",
                )}
              >
                {RESOLVE_REPORT_ACTION}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ReportedMessage({ state }: { state: ReportedMessageState | null }) {
  if (!state || state.status === "loading") {
    return (
      <div
        aria-hidden="true"
        className="bg-surface-input h-16 animate-pulse rounded-xl"
      />
    );
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
    />
  );
}
