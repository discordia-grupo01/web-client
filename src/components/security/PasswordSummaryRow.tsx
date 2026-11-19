"use client";

import { ACCOUNT_PASSWORD_COPY } from "@discordia/client-shared";

import { ChevronRight, KeyRound } from "lucide-react";

interface PasswordSummaryRowProps {
  hasPassword: boolean;
  onOpen: () => void;
}

export function PasswordSummaryRow({
  hasPassword,
  onOpen,
}: PasswordSummaryRowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="bg-surface-raised border-line hover:bg-surface-hover flex w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left transition-colors sm:p-5"
    >
      <div className="bg-surface-input text-info flex size-12 shrink-0 items-center justify-center rounded-2xl">
        <KeyRound size={23} />
      </div>
      <div className="min-w-0 flex-1">
        <strong className="text-content font-display mb-1 block text-sm sm:text-base">
          {hasPassword
            ? ACCOUNT_PASSWORD_COPY.changeRowTitle
            : ACCOUNT_PASSWORD_COPY.setRowTitle}
        </strong>
        <p className="text-content-muted text-xs leading-relaxed sm:text-sm">
          {hasPassword
            ? ACCOUNT_PASSWORD_COPY.changeRowDescription
            : ACCOUNT_PASSWORD_COPY.setRowDescription}
        </p>
      </div>
      <ChevronRight size={18} className="text-content-subtle shrink-0" />
    </button>
  );
}
