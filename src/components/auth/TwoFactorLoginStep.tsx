"use client";

import {
  ACCOUNT_RECOVERY_CHALLENGE_EXPIRED,
  ACCOUNT_RECOVERY_LINK,
  formatTwoFactorChallengeCountdown,
  TWO_FACTOR_CHALLENGE_EXPIRED,
} from "@discordia/client-shared";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { useChallengeCountdown } from "./hooks/useChallengeCountdown";
import { RecoveryRequestForm } from "./RecoveryRequestForm";
import { RecoveryRequestOutcome } from "./RecoveryRequestOutcome";
import { TwoFactorVerifyForm } from "./TwoFactorVerifyForm";

type StepView = "verify" | "recovery" | "sent" | "pending";

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
  const [view, setView] = useState<StepView>("verify");
  const [emailHint, setEmailHint] = useState("");
  const challengeInUse = view === "verify" || view === "recovery";

  const secondsLeft = useChallengeCountdown(
    expiresIn,
    () =>
      onChallengeLost(
        view === "recovery"
          ? ACCOUNT_RECOVERY_CHALLENGE_EXPIRED
          : TWO_FACTOR_CHALLENGE_EXPIRED,
      ),
    challengeInUse,
  );

  if (view === "sent") {
    return (
      <RecoveryRequestOutcome
        status="sent"
        emailHint={emailHint}
        onBack={onBack}
      />
    );
  }
  if (view === "pending") {
    return <RecoveryRequestOutcome status="pending" onBack={onBack} />;
  }

  return (
    <>
      {view === "recovery" ? (
        <RecoveryRequestForm
          onCancel={() => setView("verify")}
          onSent={(hint) => {
            setEmailHint(hint);
            setView("sent");
          }}
          onAlreadyPending={() => setView("pending")}
          onChallengeLost={onChallengeLost}
        />
      ) : (
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
            onChallengeLost={onChallengeLost}
            onVerified={onVerified}
          />

          <button
            type="button"
            onClick={() => setView("recovery")}
            className="text-info mx-auto mt-4 block cursor-pointer text-xs transition-colors hover:underline"
          >
            {ACCOUNT_RECOVERY_LINK}
          </button>
        </>
      )}

      <p className="text-content-subtle mt-4 flex items-center justify-between text-xs">
        <span>Sesión aún no iniciada</span>
        <span className="font-mono tabular-nums">
          {formatTwoFactorChallengeCountdown(secondsLeft)}
        </span>
      </p>
    </>
  );
}
