"use client";

import type { TwoFactorStatus } from "@discordia/client-shared";

import { ChevronRight, Shield } from "lucide-react";

import { cn } from "@/lib/cn";

interface TwoFactorSummaryRowProps {
  status: TwoFactorStatus;
  onOpen: (status: TwoFactorStatus) => void;
}

export function TwoFactorSummaryRow({
  status,
  onOpen,
}: TwoFactorSummaryRowProps) {
  const enabled = status.enabled;

  return (
    <button
      type="button"
      onClick={() => onOpen(status)}
      className="bg-surface-raised border-line hover:bg-surface-hover flex w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left transition-colors sm:p-5"
    >
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl",
          enabled ? "bg-success/15 text-success" : "bg-surface-input text-info",
        )}
      >
        <Shield size={23} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <strong className="text-content font-display text-sm sm:text-base">
            Verificación en dos pasos
          </strong>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
              enabled
                ? "bg-success/15 text-success"
                : "bg-surface-input text-content-subtle",
            )}
          >
            {enabled ? "Activada" : "Desactivada"}
          </span>
        </div>
        <p className="text-content-muted text-xs leading-relaxed sm:text-sm">
          {enabled
            ? "Tu cuenta requiere un segundo código para iniciar sesión."
            : "Protegé tu cuenta con una app autenticadora y códigos de recuperación."}
        </p>
      </div>
      <ChevronRight size={18} className="text-content-subtle shrink-0" />
    </button>
  );
}
