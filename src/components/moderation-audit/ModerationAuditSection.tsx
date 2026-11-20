"use client";

import {
  MODERATION_AUDIT_DESCRIPTION,
  MODERATION_AUDIT_EMPTY,
} from "@discordia/client-shared";

import { FormAlert } from "@/components/ui/FormAlert";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { AuditEntryRow } from "./AuditEntryRow";
import { useModerationAudit } from "./hooks/useModerationAudit";

interface ModerationAuditSectionProps {
  serverId: string;
}

export function ModerationAuditSection({
  serverId,
}: ModerationAuditSectionProps) {
  const audit = useModerationAudit(serverId);

  return (
    <SettingsSection
      description={MODERATION_AUDIT_DESCRIPTION}
      toolbar={<FormAlert message={audit.loadError} />}
      footer={
        audit.pageCount > 1 ? (
          <PaginationFooter
            page={audit.page}
            pageCount={audit.pageCount}
            range={audit.range}
            total={audit.total}
            noun="acciones"
            onPageChange={audit.setPage}
            className="border-line shrink-0 border-t px-4 py-3 sm:px-8"
          />
        ) : null
      }
    >
      {audit.entries === null ? (
        <LoadingSpinner />
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
    </SettingsSection>
  );
}
