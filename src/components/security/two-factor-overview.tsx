"use client";

import { twoFactorRecoveryCodesRemaining } from "@discordia/client-shared";

import { Download, KeyRound, Lock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface TwoFactorOverviewProps {
  enabled: boolean;
  recoveryCodesRemaining: number;
  onActivate: () => void;
  onRegenerate: () => void;
  onDisable: () => void;
}

export function TwoFactorOverview({
  enabled,
  recoveryCodesRemaining,
  onActivate,
  onRegenerate,
  onDisable,
}: TwoFactorOverviewProps) {
  return (
    <div className="space-y-5">
      <div className="bg-surface-raised border-line flex flex-col gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-2xl",
            enabled
              ? "bg-success/15 text-success"
              : "bg-surface-input text-content-subtle",
          )}
        >
          {enabled ? <ShieldCheck size={28} /> : <KeyRound size={28} />}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-content font-display font-bold">
              {enabled ? "Protección activada" : "Protección desactivada"}
            </h3>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                enabled
                  ? "bg-success/15 text-success"
                  : "bg-surface-input text-content-subtle",
              )}
            >
              {enabled ? "Activa" : "Inactiva"}
            </span>
          </div>
          <p className="text-content-muted text-sm leading-relaxed">
            {enabled
              ? "Tu contraseña y un código protegen el acceso a tu cuenta."
              : "Sumá una segunda barrera de seguridad con una app autenticadora."}
          </p>
          {enabled ? (
            <p
              className={cn(
                "mt-1 text-xs",
                recoveryCodesRemaining <= 2
                  ? "text-highlight"
                  : "text-content-subtle",
              )}
            >
              {twoFactorRecoveryCodesRemaining(recoveryCodesRemaining)}
            </p>
          ) : null}
        </div>
        {!enabled ? (
          <Button
            type="button"
            onClick={onActivate}
            className="w-auto px-4 py-2.5 sm:w-auto"
          >
            Activar
          </Button>
        ) : null}
      </div>

      {enabled ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onRegenerate}
            className="bg-surface-input border-line hover:bg-surface-hover flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors"
          >
            <Download size={19} className="text-info shrink-0" />
            <span>
              <strong className="text-content font-display block text-sm">
                Nuevos códigos
              </strong>
              <small className="text-content-subtle">
                Reemplaza la lista anterior
              </small>
            </span>
          </button>

          <button
            type="button"
            onClick={onDisable}
            className="border-danger/20 bg-danger/5 hover:bg-danger/10 flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors"
          >
            <Lock size={19} className="text-danger shrink-0" />
            <span>
              <strong className="text-danger font-display block text-sm">
                Desactivar 2FA
              </strong>
              <small className="text-content-subtle">
                Volver a usar solo contraseña
              </small>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
