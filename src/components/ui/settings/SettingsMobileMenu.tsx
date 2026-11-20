import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { SettingsMobileTitleBar } from "./SettingsHeading";
import type { SettingsDangerAction, SettingsNavGroup } from "./settingsNav";

const MOBILE_ICON_SIZE = 20;

export function SettingsMobileMenu<Id extends string>({
  title,
  onClose,
  header,
  groups,
  dangerAction,
  onSelect,
}: {
  title: string;
  onClose: () => void;
  header?: ReactNode;
  groups: SettingsNavGroup<Id>[];
  dangerAction?: SettingsDangerAction;
  onSelect: (id: Id) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col sm:hidden">
      <SettingsMobileTitleBar heading={{ title, onClose }} />
      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {header}
        {groups.map((group) => (
          <div key={group.label} className="space-y-3">
            <p className="text-content-muted font-display px-1 pt-1 text-sm font-semibold">
              {group.label}
            </p>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className="bg-surface-raised border-line text-content-muted flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left"
              >
                <span className="bg-surface-input text-info flex size-11 shrink-0 items-center justify-center rounded-xl">
                  {item.icon({ size: MOBILE_ICON_SIZE, active: false })}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="text-content font-display block text-base">
                    {item.label}
                  </strong>
                  <small className="text-content-subtle">
                    {item.description}
                  </small>
                </span>
                {item.badge}
                <ChevronRight size={18} className="text-content-subtle" />
              </button>
            ))}
          </div>
        ))}
        {dangerAction ? (
          <button
            type="button"
            onClick={dangerAction.onClick}
            className="bg-surface-raised border-line text-danger flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left"
          >
            <span className="bg-danger/10 flex size-11 shrink-0 items-center justify-center rounded-xl">
              <dangerAction.icon size={MOBILE_ICON_SIZE} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="font-display block text-base">
                {dangerAction.label}
              </strong>
              {dangerAction.description ? (
                <small className="text-content-subtle">
                  {dangerAction.description}
                </small>
              ) : null}
            </span>
          </button>
        ) : null}
      </nav>
    </div>
  );
}
