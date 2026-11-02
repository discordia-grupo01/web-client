"use client";

import {
  NOTIFICATIONS_TAB_LABELS,
  type NotificationTab,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";

const TABS: NotificationTab[] = [
  "unread",
  "all",
  "mentions",
  "direct_messages",
];

interface NotificationTabsProps {
  value: NotificationTab;
  onChange: (tab: NotificationTab) => void;
  label: string;
}

export function NotificationTabs({
  value,
  onChange,
  label,
}: NotificationTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="border-line flex shrink-0 overflow-x-auto overflow-y-hidden border-b px-2"
    >
      {TABS.map((tab) => {
        const isSelected = tab === value;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(tab)}
            className={cn(
              "-mb-px min-w-fit flex-1 cursor-pointer border-b-2 px-2 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors sm:text-sm",
              "focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none",
              isSelected
                ? "border-accent text-content"
                : "text-content-muted hover:text-content border-transparent",
            )}
          >
            {NOTIFICATIONS_TAB_LABELS[tab]}
          </button>
        );
      })}
    </div>
  );
}
