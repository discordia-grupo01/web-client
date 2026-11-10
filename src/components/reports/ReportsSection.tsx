"use client";

import {
  type Channel,
  type ClosedReportStatus,
  type Message,
  type Report,
  type ReportSanction,
  reportSanctionTarget,
  REPORTS_CLOSED_TAB,
  REPORTS_DESCRIPTION,
  REPORTS_DISMISSED_EMPTY,
  REPORTS_DISMISSED_FILTER,
  REPORTS_PENDING_EMPTY,
  REPORTS_PENDING_HINT,
  REPORTS_PENDING_TAB,
  REPORTS_RESOLVED_EMPTY,
  REPORTS_RESOLVED_FILTER,
  REPORTS_TITLE,
  unknownAuthor,
} from "@discordia/client-shared";
import { Check } from "lucide-react";
import { useMemo } from "react";

import { BanMemberModal } from "@/components/bans/BanMemberModal";
import { DeleteMessageModal } from "@/components/messages/DeleteMessageModal";
import { KickMemberModal } from "@/components/moderation/KickMemberModal";
import { MuteMemberModal } from "@/components/moderation/MuteMemberModal";
import { FormAlert } from "@/components/ui/FormAlert";
import { Pagination } from "@/components/ui/Pagination";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { useMessageAuthors } from "@/hooks/useMessageAuthors";
import { useServerMembers } from "@/hooks/useServerMembers";
import { cn } from "@/lib/cn";
import { avatarSrcOf, displayNameOf } from "@/utils/userProfile";

import { useReportAction } from "./hooks/useReportAction";
import { useReportedMessages } from "./hooks/useReportedMessages";
import { type ReportsTab, useReportsList } from "./hooks/useReportsList";
import { type ReportedMessageState, ReportRow } from "./ReportRow";

const TABS: { value: ReportsTab; label: string }[] = [
  { value: "pending", label: REPORTS_PENDING_TAB },
  { value: "closed", label: REPORTS_CLOSED_TAB },
];

const CLOSED_FILTERS: { value: ClosedReportStatus; label: string }[] = [
  { value: "resolved", label: REPORTS_RESOLVED_FILTER },
  { value: "dismissed", label: REPORTS_DISMISSED_FILTER },
];

const EMPTY_TEXT = {
  pending: REPORTS_PENDING_EMPTY,
  resolved: REPORTS_RESOLVED_EMPTY,
  dismissed: REPORTS_DISMISSED_EMPTY,
};

interface ReportsSectionProps {
  serverId: string;
  ownerId: string;
  currentUserId: string | null;
  channels: Channel[];
  titleId: string;
  onGoToMessage: (channelId: string, messageId: string) => void;
  onOpenProfile: (userId: string) => void;
  /** Se cerro un pendiente: el total del indicador cambia. */
  onPendingChanged: () => void;
  /** Se expulso, baneo o silencio a alguien: la lista de miembros cambia. */
  onMembersChanged: () => void;
}

/** Configuracion → Reportes (#62). Solo la ven los moderadores. */
export function ReportsSection({
  serverId,
  ownerId,
  currentUserId,
  channels,
  titleId,
  onGoToMessage,
  onOpenProfile,
  onPendingChanged,
  onMembersChanged,
}: ReportsSectionProps) {
  const list = useReportsList(serverId, onPendingChanged);
  const action = useReportAction(list.close);
  const reported = useReportedMessages(list.reports);
  const members = useServerMembers(serverId);
  const loadedMessages = useMemo(
    () =>
      reported.status === "ready"
        ? Object.values(reported.byId).filter(
            (message): message is Message => message !== null,
          )
        : null,
    [reported],
  );
  const authors = useMessageAuthors(members, loadedMessages, null, []);
  const channelNames = useMemo(
    () => new Map(channels.map((channel) => [channel.id, channel.name])),
    [channels],
  );

  function messageStateOf(report: Report): ReportedMessageState | null {
    if (report.kind !== "message" || !report.message_id) return null;
    if (reported.status !== "ready") return reported;
    const message = reported.byId[report.message_id];
    if (!message) return { status: "gone" };
    return {
      status: "ready",
      message,
      author: authors[message.user_id] ?? unknownAuthor(message.user_id),
    };
  }

  function sanctionsFor(
    report: Report,
    messageState: ReportedMessageState | null,
  ): ReportSanction[] {
    const message =
      messageState?.status === "ready" ? messageState.message : null;
    const target = reportSanctionTarget(report, message?.user_id ?? null, {
      currentUserId,
      ownerId,
    });
    const sanctions: ReportSanction[] = message ? ["delete"] : [];
    return target ? [...sanctions, "mute", "kick", "ban"] : sanctions;
  }

  function startSanction(
    report: Report,
    messageState: ReportedMessageState | null,
    sanction: ReportSanction,
  ) {
    if (messageState?.status === "ready") {
      const { message, author } = messageState;
      if (sanction === "delete") {
        action.start({ sanction, report, message, author });
        return;
      }
      action.start({
        sanction,
        report,
        target: {
          userId: message.user_id,
          name: author.name,
          avatarSrc: author.avatarUrl,
        },
      });
      return;
    }
    if (sanction === "delete" || !report.reported_user_id) return;
    action.start({
      sanction,
      report,
      target: {
        userId: report.reported_user_id,
        name: displayNameOf(report.reported_profile),
        avatarSrc: avatarSrcOf(
          report.reported_user_id,
          report.reported_profile,
        ),
      },
    });
  }

  const active = action.active;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-6 pb-2 sm:px-7 sm:pt-8">
        <h2
          id={titleId}
          className="font-display text-content mb-1 text-xl font-bold"
        >
          {REPORTS_TITLE}
        </h2>
        <p className="text-content-muted text-sm leading-relaxed">
          {REPORTS_DESCRIPTION}
        </p>
      </div>

      <div className="shrink-0 space-y-4 px-4 pt-5 pb-4 sm:px-7">
        <SegmentedTabs
          tabs={TABS}
          value={list.tab}
          onChange={list.setTab}
          label={REPORTS_TITLE}
        />
        {list.tab === "pending" ? (
          <p className="text-content-muted text-[13px] leading-relaxed">
            {REPORTS_PENDING_HINT}
          </p>
        ) : null}
        {list.tab === "closed" ? (
          <div className="flex gap-2">
            {CLOSED_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={list.closedFilter === filter.value}
                onClick={() => list.setClosedFilter(filter.value)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors",
                  list.closedFilter === filter.value
                    ? "border-accent bg-accent/15 text-content"
                    : "border-line text-content-muted hover:text-content",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        ) : null}

        {action.notice?.tone === "success" ? (
          <p
            role="status"
            className="bg-success/10 text-success flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          >
            <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{action.notice.text}</span>
          </p>
        ) : (
          <FormAlert message={action.notice?.text} />
        )}
        <FormAlert message={list.loadError} />
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-5 sm:mr-1.5 sm:mb-2 sm:pr-5.5 sm:pl-7">
        {list.reports === null ? (
          <p className="text-content-subtle text-sm">Cargando…</p>
        ) : list.reports.length === 0 && !list.loadError ? (
          <p className="text-content-subtle py-6 text-center text-sm">
            {EMPTY_TEXT[list.status]}
          </p>
        ) : (
          <ul className="space-y-3">
            {list.reports.map((report) => {
              const messageState = messageStateOf(report);
              const { channel_id: channelId, message_id: messageId } = report;
              const reportedUserId = report.reported_user_id;
              const isPending = report.status === "pending";
              return (
                <li key={report.id}>
                  <ReportRow
                    report={report}
                    reportedMessage={messageState}
                    channelName={
                      channelId ? (channelNames.get(channelId) ?? null) : null
                    }
                    sanctions={sanctionsFor(report, messageState)}
                    isClosing={action.closingId === report.id}
                    onGoToMessage={
                      isPending &&
                      messageState?.status === "ready" &&
                      channelId &&
                      messageId
                        ? () => onGoToMessage(channelId, messageId)
                        : undefined
                    }
                    onViewProfile={
                      isPending && reportedUserId
                        ? () => onOpenProfile(reportedUserId)
                        : undefined
                    }
                    onSanction={(sanction) =>
                      startSanction(report, messageState, sanction)
                    }
                    onResolve={() =>
                      void action.closeManually(report, "resolved")
                    }
                    onDismiss={() =>
                      void action.closeManually(report, "dismissed")
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}

        {list.pageCount > 1 ? (
          <Pagination
            page={list.page}
            pageCount={list.pageCount}
            onPageChange={list.setPage}
            isCompact
          />
        ) : null}
      </div>

      {active?.sanction === "delete" ? (
        <DeleteMessageModal
          message={active.message}
          author={active.author}
          onConfirm={() => void action.confirmDelete()}
          onCancel={action.cancel}
        />
      ) : null}
      {active?.sanction === "mute" ? (
        <MuteMemberModal
          serverId={serverId}
          target={active.target}
          onClose={action.cancel}
          onMuted={() => {
            action.sanctionApplied();
            onMembersChanged();
          }}
        />
      ) : null}
      {active?.sanction === "kick" ? (
        <KickMemberModal
          serverId={serverId}
          target={active.target}
          onClose={action.cancel}
          onKicked={() => {
            action.sanctionApplied();
            onMembersChanged();
          }}
        />
      ) : null}
      {active?.sanction === "ban" ? (
        <BanMemberModal
          serverId={serverId}
          userId={active.target.userId}
          name={active.target.name}
          avatarSrc={active.target.avatarSrc}
          onClose={action.cancel}
          onBanned={() => {
            action.sanctionApplied();
            onMembersChanged();
          }}
        />
      ) : null}
    </div>
  );
}
