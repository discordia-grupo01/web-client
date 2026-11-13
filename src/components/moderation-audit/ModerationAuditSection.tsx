"use client";

import {
  MODERATION_AUDIT_DESCRIPTION,
  MODERATION_AUDIT_EMPTY,
  MODERATION_AUDIT_TITLE,
} from "@discordia/client-shared";

import { FormAlert } from "@/components/ui/FormAlert";
import { PaginationFooter } from "@/components/ui/PaginationFooter";

import { AuditEntryRow } from "./AuditEntryRow";
import { useModerationAudit } from "./hooks/useModerationAudit";

interface ModerationAuditSectionProps {
  serverId: string;
  titleId: string;
}

export function ModerationAuditSection({
  serverId,
  titleId,
}: ModerationAuditSectionProps) {
  const audit = useModerationAudit(serverId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pt-6 pb-2 sm:px-7 sm:pt-8">
        <h2
          id={titleId}
          className="font-display text-content mb-1 text-xl font-bold"
        >
          {MODERATION_AUDIT_TITLE}
        </h2>
        <p className="text-content-muted text-sm leading-relaxed">
          {MODERATION_AUDIT_DESCRIPTION}
        </p>
      </div>

      {audit.loadError ? (
        <div className="shrink-0 px-4 pt-5 sm:px-7">
          <FormAlert message={audit.loadError} />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-5 pb-5 sm:mr-1.5 sm:mb-2 sm:pr-5.5 sm:pl-7">
        {audit.entries === null ? (
          <p className="text-content-subtle text-sm">Cargando…</p>
        ) : audit.entries.length === 0 && !audit.loadError ? (
          <p className="text-content-subtle py-6 text-center text-sm">
            {MODERATION_AUDIT_EMPTY}
          </p>
        ) : (
          <ul className="space-y-3">
            {audit.entries.map((entry) => (
              <li key={entry.id}>
                <AuditEntryRow entry={entry} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {audit.pageCount > 1 ? (
        <PaginationFooter
          page={audit.page}
          pageCount={audit.pageCount}
          range={audit.range}
          total={audit.total}
          noun="acciones"
          onPageChange={audit.setPage}
          className="border-line shrink-0 border-t px-4 py-3 sm:px-7"
        />
      ) : null}
    </div>
  );
}
