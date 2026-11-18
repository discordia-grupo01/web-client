"use client";

import { Trash2 } from "lucide-react";

import { BoostsSectionIcon } from "@/components/boosts/icons/BoostsSectionIcon";
import { ReportsBadge } from "@/components/reports/ReportsBadge";
import { cn } from "@/lib/cn";

import {
  SECTION_DESCRIPTIONS,
  SECTION_TITLES,
  type SettingsSection,
} from "@/components/servers/utils/settingsSections";

import { SECTION_ICONS } from "./sectionIcons";

interface SettingsSidebarProps {
  serverName: string;
  sections: SettingsSection[];
  activeSection: SettingsSection;
  canDelete: boolean;
  pendingReports: number;
  pendingReportsLabel: string;
  onSelect: (section: SettingsSection) => void;
  onDelete: () => void;
}

/** Mismo estilo que la barra lateral de la configuración de la cuenta. */
export function SettingsSidebar({
  serverName,
  sections,
  activeSection,
  canDelete,
  pendingReports,
  pendingReportsLabel,
  onSelect,
  onDelete,
}: SettingsSidebarProps) {
  return (
    <aside className="bg-surface-sunken border-line hidden w-56 shrink-0 flex-col border-r p-4 sm:flex">
      <div className="px-3 pt-2 pb-5">
        <p className="text-content font-display text-lg font-bold">
          Configuración
        </p>
        <p className="text-content-muted font-display truncate text-sm font-semibold">
          {serverName}
        </p>
      </div>

      <nav className="-mx-1 min-h-0 flex-1 space-y-1 overflow-y-auto px-1">
        {sections.map((section) => {
          const isActive = section === activeSection;
          const Icon = SECTION_ICONS[section];
          return (
            <button
              key={section}
              type="button"
              onClick={() => onSelect(section)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                isActive
                  ? "bg-accent text-on-accent"
                  : "text-content-muted hover:bg-surface-hover",
              )}
            >
              {section === "boosts" ? (
                <BoostsSectionIcon
                  size={17}
                  onAccent={isActive}
                  className="shrink-0"
                />
              ) : (
                <Icon size={17} className="shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <strong className="font-display block text-sm">
                  {SECTION_TITLES[section]}
                </strong>
                <small
                  className={cn(
                    "mt-0.5 block leading-snug",
                    section === "boosts" && isActive
                      ? "text-sky"
                      : "opacity-60",
                  )}
                >
                  {SECTION_DESCRIPTIONS[section]}
                </small>
              </span>
              {section === "reports" && pendingReports > 0 ? (
                <ReportsBadge
                  count={pendingReports}
                  label={pendingReportsLabel}
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="text-danger hover:bg-danger/10 mt-3 flex w-full shrink-0 cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
        >
          <Trash2 size={17} className="shrink-0" />
          <strong className="font-display text-sm">Eliminar servidor</strong>
        </button>
      ) : null}
    </aside>
  );
}
