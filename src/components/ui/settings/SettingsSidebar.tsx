import { cn } from "@/lib/cn";

import type {
  SettingsDangerAction,
  SettingsNavGroup,
  SettingsNavItem,
} from "./settingsNav";

const ICON_SIZE = 18;

interface SettingsSidebarProps<Id extends string> {
  menuTitle: string;
  menuSubtitle?: string;
  groups: SettingsNavGroup<Id>[];
  activeId: Id;
  onSelect: (id: Id) => void;
  dangerAction?: SettingsDangerAction;
}

export function SettingsSidebar<Id extends string>({
  menuTitle,
  menuSubtitle,
  groups,
  activeId,
  onSelect,
  dangerAction,
}: SettingsSidebarProps<Id>) {
  return (
    <aside className="border-line bg-surface-sunken hidden w-[248px] shrink-0 flex-col border-r p-4 sm:flex">
      <div className="px-3 pt-2 pb-5">
        <p className="text-content font-display text-lg font-bold">
          {menuTitle}
        </p>
        {menuSubtitle ? (
          <p className="text-content-muted font-display truncate text-sm font-semibold">
            {menuSubtitle}
          </p>
        ) : null}
      </div>
      <nav className="-mx-1 min-h-0 flex-1 space-y-5 overflow-y-auto px-1">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-content-muted font-display px-3 pb-2 text-sm font-semibold">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  active={item.id === activeId}
                  onSelect={() => onSelect(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
      {dangerAction ? (
        <button
          type="button"
          onClick={dangerAction.onClick}
          className="text-danger hover:bg-danger/10 mt-3 flex w-full shrink-0 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
        >
          <dangerAction.icon size={ICON_SIZE} className="shrink-0" />
          <strong className="font-display text-sm">{dangerAction.label}</strong>
        </button>
      ) : null}
    </aside>
  );
}

function SidebarItem<Id extends string>({
  item,
  active,
  onSelect,
}: {
  item: SettingsNavItem<Id>;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "page" : undefined}
      title={item.description}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        active && item.tone === "premium"
          ? "text-boost-ink bg-amber"
          : active
            ? "bg-accent text-on-accent"
            : "text-content-muted hover:bg-surface-hover",
      )}
    >
      <span className="flex size-[18px] shrink-0 items-center justify-center">
        {item.icon({ size: ICON_SIZE, active })}
      </span>
      <span className="min-w-0 flex-1">
        <strong className="font-display block truncate text-sm">
          {item.label}
        </strong>
        <small
          className={cn(
            "block truncate",
            active && item.tone === "boost" ? "text-sky" : "opacity-60",
          )}
        >
          {item.description}
        </small>
      </span>
      {item.badge}
    </button>
  );
}
