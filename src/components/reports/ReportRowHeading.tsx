"use client";

import {
  formatMessageTimestamp,
  parseReportReason,
  type Report,
  REPORT_DISMISSED_BADGE,
  reportedByLabel,
  reportResolvedLabel,
} from "@discordia/client-shared";
import { Flag } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { avatarSrcOf, displayNameOf } from "@/utils/userProfile";

interface ReportRowHeadingProps {
  report: Report;
  onOpenProfile?: () => void;
}

export function ReportRowHeading({
  report,
  onOpenProfile,
}: ReportRowHeadingProps) {
  const meta = (
    <span className="text-content-subtle">
      {reportedByLabel(displayNameOf(report.reporter_profile))} ·{" "}
      {formatMessageTimestamp(report.resolved_at ?? report.created_at)}
    </span>
  );

  if (report.kind !== "user") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <ReportBadges report={report} />
        {meta}
      </div>
    );
  }

  const name = displayNameOf(report.reported_profile);
  const identity = (
    <>
      <Avatar
        name={name}
        src={
          report.reported_user_id
            ? avatarSrcOf(report.reported_user_id, report.reported_profile)
            : null
        }
        size={40}
        className="shrink-0 rounded-full"
      />
      <span className="min-w-0">
        <span className="font-display text-content block truncate font-semibold">
          {name}
        </span>
        <span className="block text-xs">{meta}</span>
      </span>
    </>
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      {onOpenProfile ? (
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={`Ver perfil de ${name}`}
          className="flex min-w-0 cursor-pointer items-center gap-3 text-left hover:opacity-80"
        >
          {identity}
        </button>
      ) : (
        <div className="flex min-w-0 items-center gap-3">{identity}</div>
      )}
      <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
        <ReportBadges report={report} />
      </div>
    </div>
  );
}

function ReportBadges({ report }: { report: Report }) {
  const { category } = parseReportReason(report.reason);
  return (
    <>
      {category ? (
        <span className="bg-warning/15 text-warning flex items-center gap-1 rounded-full px-2 py-0.5 font-bold">
          <Flag size={11} aria-hidden="true" />
          {category.label}
        </span>
      ) : null}
      {report.status !== "pending" ? (
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
    </>
  );
}
