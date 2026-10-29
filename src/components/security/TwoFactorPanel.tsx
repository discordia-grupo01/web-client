"use client";

import type { TwoFactorStatus } from "@discordia/client-shared";

import { useCallback, useState } from "react";

import { FormAlert } from "@/components/ui/FormAlert";
import {
  twoFactorDisableRequest,
  twoFactorRegenerateCodesRequest,
  twoFactorStatusRequest,
} from "@/services/two-factor/client";

import { TwoFactorDisabledConfirmation } from "./TwoFactorDisabledConfirmation";
import { TwoFactorOverview } from "./TwoFactorOverview";
import { TwoFactorPasswordForm } from "./TwoFactorPasswordForm";
import { TwoFactorRecoveryCodes } from "./TwoFactorRecoveryCodes";
import { TwoFactorSetupForm } from "./TwoFactorSetupForm";

type View =
  | "overview"
  | "setup"
  | "recovery"
  | "disable"
  | "regenerate"
  | "disabled-confirmation";

interface TwoFactorPanelProps {
  initialStatus: TwoFactorStatus;
  onBack: () => void;
}

export function TwoFactorPanel({ initialStatus, onBack }: TwoFactorPanelProps) {
  const [view, setView] = useState<View>(
    initialStatus.enabled ? "overview" : "setup",
  );
  const [status, setStatus] = useState<TwoFactorStatus>(initialStatus);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [visibleCodes, setVisibleCodes] = useState<string[]>([]);

  const loadStatus = useCallback(async () => {
    const result = await twoFactorStatusRequest();
    if (result.ok) {
      setStatus(result.status);
      setLoadError(null);
    } else {
      setLoadError(result.message);
    }
  }, []);

  function showRecoveryCodes(codes: string[]) {
    setVisibleCodes(codes);
    setView("recovery");
  }

  async function handleDisable(password: string): Promise<string | null> {
    const result = await twoFactorDisableRequest(password);
    if (!result.ok) return result.message;

    await loadStatus();
    setView("disabled-confirmation");
    return null;
  }

  async function handleRegenerate(password: string): Promise<string | null> {
    const result = await twoFactorRegenerateCodesRequest(password);
    if (!result.ok) return result.message;

    await loadStatus();
    showRecoveryCodes(result.recoveryCodes);
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {loadError ? <FormAlert message={loadError} /> : null}

      {view === "overview" ? (
        <TwoFactorOverview
          enabled={status.enabled}
          recoveryCodesRemaining={status.recovery_codes_remaining}
          onActivate={() => setView("setup")}
          onRegenerate={() => setView("regenerate")}
          onDisable={() => setView("disable")}
        />
      ) : view === "setup" ? (
        <TwoFactorSetupForm
          onCancel={onBack}
          onActivated={(codes) => {
            void loadStatus();
            showRecoveryCodes(codes);
          }}
        />
      ) : view === "recovery" ? (
        <TwoFactorRecoveryCodes codes={visibleCodes} onDone={onBack} />
      ) : view === "disable" ? (
        <TwoFactorPasswordForm
          title="Desactivar verificación en dos pasos"
          description="Reingresá tu contraseña para confirmar. Después de esto solo te vamos a pedir tu contraseña para entrar."
          confirmLabel="Desactivar"
          danger
          onCancel={() => setView("overview")}
          onConfirm={handleDisable}
        />
      ) : view === "regenerate" ? (
        <TwoFactorPasswordForm
          title="Generar códigos nuevos"
          description="Reingresá tu contraseña. Los códigos que tengas anotados dejan de servir en cuanto se genere la lista nueva."
          confirmLabel="Generar"
          onCancel={() => setView("overview")}
          onConfirm={handleRegenerate}
        />
      ) : (
        <TwoFactorDisabledConfirmation
          onClose={onBack}
          onReactivate={() => setView("setup")}
        />
      )}
    </div>
  );
}
