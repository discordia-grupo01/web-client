"use client";

import { ArrowLeft } from "lucide-react";

import { TwoFactorVerifyForm } from "./TwoFactorVerifyForm";

interface TwoFactorLoginStepProps {
  expiresIn: number;
  onBack: () => void;
  onChallengeLost: (message: string) => void;
  onVerified: (result: {
    recoveryCodeUsed: boolean;
    recoveryCodesRemaining: number;
  }) => void;
}

export function TwoFactorLoginStep({
  expiresIn,
  onBack,
  onChallengeLost,
  onVerified,
}: TwoFactorLoginStepProps) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="text-content-subtle mb-6 flex cursor-pointer items-center gap-1.5 text-sm transition-colors hover:opacity-80"
      >
        <ArrowLeft size={14} />
        Volver al inicio de sesión
      </button>

      <h1 className="font-display text-content mb-1 text-2xl font-bold">
        Verificación en dos pasos
      </h1>
      <p className="text-content-muted mb-7 text-sm">
        Confirmá tu identidad para terminar de iniciar sesión.
      </p>

      <TwoFactorVerifyForm
        expiresIn={expiresIn}
        onChallengeLost={onChallengeLost}
        onVerified={onVerified}
      />
    </>
  );
}
