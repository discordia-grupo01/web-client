"use client";

import {
  REPORT_CATEGORY_PROMPT,
  type ReportCategory,
} from "@discordia/client-shared";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface ReportCategoryStepProps {
  preview: ReactNode;
  categories: readonly ReportCategory[];
  onChoose: (category: ReportCategory) => void;
}

export function ReportCategoryStep({
  preview,
  categories,
  onChoose,
}: ReportCategoryStepProps) {
  return (
    <div className="space-y-4 overflow-y-auto px-5 pb-5 sm:px-7">
      <p className="text-content-muted text-sm">{REPORT_CATEGORY_PROMPT}</p>
      {preview}
      <ul className="border-line bg-surface-raised divide-line divide-y overflow-hidden rounded-xl border">
        {categories.map((category) => (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => onChoose(category)}
              className="text-content hover:bg-surface-hover flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold transition-colors"
            >
              <span>{category.label}</span>
              <ChevronRight
                size={16}
                aria-hidden="true"
                className="text-content-subtle shrink-0"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
