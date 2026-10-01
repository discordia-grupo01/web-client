"use client";

import { cn } from "@/lib/cn";

export interface SegmentedTab<T extends string> {
  value: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** Pestañas en fila que se reparten el ancho, para alternar entre dos vistas. */
export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-2">
      {tabs.map((tab) => {
        const isSelected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(tab.value)}
            className={cn(
              "min-w-0 flex-1 cursor-pointer truncate rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
              "focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none",
              isSelected
                ? "bg-surface-hover text-content"
                : "bg-surface-input text-content-muted hover:text-content",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
