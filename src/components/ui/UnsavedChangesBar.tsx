"use client";

import {
  RESET_CHANGES_LABEL,
  SAVE_CHANGES_LABEL,
  UNSAVED_CHANGES_WARNING,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";

interface UnsavedChangesBarProps {
  isSaving: boolean;
  isWarning: boolean;
  onReset: () => void;
  onSave: () => void;
}

export function UnsavedChangesBar({
  isSaving,
  isWarning,
  onReset,
  onSave,
}: UnsavedChangesBarProps) {
  return (
    <div
      role="region"
      aria-label={UNSAVED_CHANGES_WARNING}
      className={cn(
        "fixed bottom-6 left-1/2 z-[60] flex w-[min(92vw,680px)] -translate-x-1/2 items-center gap-4 rounded-xl border px-4 py-3 shadow-2xl transition-colors",
        isWarning
          ? "bg-danger border-danger unsaved-bar-shake text-white"
          : "bg-surface-raised border-line-strong text-content",
      )}
    >
      <p className="flex-1 text-sm font-medium">{UNSAVED_CHANGES_WARNING}</p>
      <button
        type="button"
        onClick={onReset}
        disabled={isSaving}
        className="cursor-pointer text-sm font-semibold underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {RESET_CHANGES_LABEL}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        aria-busy={isSaving}
        className="bg-success flex min-w-36 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? (
          <span
            className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden="true"
          />
        ) : null}
        {SAVE_CHANGES_LABEL}
      </button>
    </div>
  );
}
