"use client";

import type { TwoFactorStatus } from "@discordia/client-shared";

import { TwoFactorSummaryRow } from "@/components/security/TwoFactorSummaryRow";

interface SecuritySettingsProps {
  onOpenTwoFactor: (status: TwoFactorStatus) => void;
}

export function SecuritySettings({ onOpenTwoFactor }: SecuritySettingsProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h3 className="text-content font-display text-xl font-bold">
          Seguridad y acceso
        </h3>
        <p className="text-content-muted mt-1 text-sm">
          Administrá las medidas que protegen tu cuenta.
        </p>
      </div>
      <TwoFactorSummaryRow onOpen={onOpenTwoFactor} />
    </div>
  );
}
