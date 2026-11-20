"use client";

import {
  MODERATION_AUDIT_DESCRIPTION,
  MODERATION_AUDIT_EMPTY,
} from "@discordia/client-shared";

import { FileText } from "lucide-react";

import { FormAlert } from "@/components/ui/FormAlert";
import { PaginationFooter } from "@/components/ui/PaginationFooter";
import { SettingsEmptyState } from "@/components/ui/settings/SettingsEmptyState";
import { SettingsGroup } from "@/components/ui/settings/SettingsGroup";
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
    >
      {audit.entries === null ? (
        <LoadingSpinner />
      ) : audit.entries.length === 0 && !audit.loadError ? (
        <SettingsEmptyState icon={FileText} text={MODERATION_AUDIT_EMPTY} />
      ) : (
        <SettingsGroup label="Acciones registradas" count={audit.total}>
          <ul className="space-y-3">
            {audit.entries.map((entry) => (
              <li key={entry.id}>
                <AuditEntryRow entry={entry} />
              </li>
            ))}
          </ul>
          {audit.pageCount > 1 ? (
            <PaginationFooter
              page={audit.page}
              pageCount={audit.pageCount}
              range={audit.range}
              total={audit.total}
              noun="acciones"
              onPageChange={audit.setPage}
              className="mt-4"
            />
          ) : null}
        </SettingsGroup>
      )}
    </SettingsSection>
  );
}
