"use client";

import { type ServerSummary } from "@discordia/client-shared";
import {
  Ban,
  ChevronRight,
  Flag,
  type LucideIcon,
  Pencil,
  Trash2,
} from "lucide-react";

import { ReportsBadge } from "@/components/reports/ReportsBadge";

import { Avatar } from "@/components/ui/Avatar";
import { serverIconSrc } from "@/utils/image-urls";

import {
  SECTION_DESCRIPTIONS,
  SECTION_TITLES,
  type SettingsSection,
} from "@/components/servers/utils/settingsSections";

const SECTION_ICONS: Record<SettingsSection, LucideIcon> = {
  profile: Pencil,
  words: Ban,
  reports: Flag,
};

interface SettingsMobileMenuProps {
  server: ServerSummary;
  sections: SettingsSection[];
  canDelete: boolean;
  pendingReports: number;
  pendingReportsLabel: string;
  onSelect: (section: SettingsSection) => void;
  onDelete: () => void;
}

/** Lista de secciones que se ve por debajo de `sm`, en lugar del sidebar. */
export function SettingsMobileMenu({
  server,
  sections,
  canDelete,
  pendingReports,
  pendingReportsLabel,
  onSelect,
  onDelete,
}: SettingsMobileMenuProps) {
  return (
    <nav className="flex-1 space-y-3 overflow-y-auto p-4 sm:hidden">
      <div className="flex flex-col items-center pt-3 pb-4">
        <Avatar
          name={server.name}
          src={serverIconSrc(server)}
          size={80}
          className="rounded-3xl"
        />
        <p className="text-content font-display mt-3 max-w-full truncate text-lg font-bold">
          {server.name}
        </p>
      </div>

      {sections.map((section) => {
        const Icon = SECTION_ICONS[section];
        return (
          <button
            key={section}
            type="button"
            onClick={() => onSelect(section)}
            className="bg-surface-raised border-line text-content-muted flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left"
          >
            <span className="bg-surface-input text-info flex size-11 shrink-0 items-center justify-center rounded-xl">
              <Icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="text-content font-display block text-base">
                {SECTION_TITLES[section]}
              </strong>
              <small className="text-content-subtle">
                {SECTION_DESCRIPTIONS[section]}
              </small>
            </span>
            {section === "reports" && pendingReports > 0 ? (
              <ReportsBadge
                count={pendingReports}
                label={pendingReportsLabel}
              />
            ) : null}
            <ChevronRight size={18} className="text-content-subtle" />
          </button>
        );
      })}

      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="bg-surface-raised border-line text-danger flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left"
        >
          <span className="bg-danger/10 flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Trash2 size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="font-display block text-base">
              Eliminar servidor
            </strong>
            <small className="text-content-subtle">
              Esta acción no se puede deshacer
            </small>
          </span>
        </button>
      ) : null}
    </nav>
  );
}
