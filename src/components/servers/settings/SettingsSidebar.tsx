"use client";

import { cn } from "@/lib/cn";

import {
  SECTION_TITLES,
  type SettingsSection,
} from "@/components/servers/utils/settingsSections";

interface SettingsSidebarProps {
  serverName: string;
  sections: SettingsSection[];
  activeSection: SettingsSection;
  canDelete: boolean;
  onSelect: (section: SettingsSection) => void;
  onDelete: () => void;
}

export function SettingsSidebar({
  serverName,
  sections,
  activeSection,
  canDelete,
  onSelect,
  onDelete,
}: SettingsSidebarProps) {
  return (
    <nav className="border-line bg-surface-raised hidden w-56 shrink-0 flex-col border-r px-3 py-8 sm:flex">
      <p className="text-content-subtle mb-1 truncate px-3 text-xs font-bold tracking-wider uppercase">
        {serverName}
      </p>
      {sections.map((section) => {
        const isActive = section === activeSection;
        return (
          <button
            key={section}
            type="button"
            onClick={() => onSelect(section)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "mt-1 cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
              isActive
                ? "bg-surface-input text-content"
                : "text-content-muted hover:bg-surface-input/60 hover:text-content",
            )}
          >
            {SECTION_TITLES[section]}
          </button>
        );
      })}

      {canDelete ? (
        <>
          <div className="border-line mx-3 mt-6 mb-2 border-t" />
          <button
            type="button"
            onClick={onDelete}
            className="text-danger hover:bg-danger/10 cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors"
          >
            Eliminar servidor
          </button>
        </>
      ) : null}
    </nav>
  );
}
