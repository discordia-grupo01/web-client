"use client";

import type { TwoFactorStatus } from "@discordia/client-shared";

import { Shield } from "lucide-react";
import { useCallback, useState } from "react";

import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";
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

interface TwoFactorModalProps {
  initialStatus: TwoFactorStatus;
  onClose: () => void;
  onStatusChange: () => void;
}

export function TwoFactorModal({
  initialStatus,
  onClose,
  onStatusChange,
}: TwoFactorModalProps) {
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

  function handleClose() {
    onStatusChange();
    onClose();
  }

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
    <ModalShell
      onClose={handleClose}
      labelledBy="two-factor-modal-title"
      maxWidth={560}
    >
      <div className="border-line flex items-center gap-3 border-b px-6 py-5">
        <div className="bg-info/15 text-info flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Shield size={20} />
        </div>
        <div>
          <h2
            id="two-factor-modal-title"
            className="text-content font-display text-lg font-bold"
          >
            Verificación en dos pasos
          </h2>
          <p className="text-content-subtle text-xs">Seguridad de tu cuenta</p>
        </div>
      </div>

      <div className="overflow-y-auto p-6">
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
            onCancel={handleClose}
            onActivated={(codes) => {
              void loadStatus();
              showRecoveryCodes(codes);
            }}
          />
        ) : view === "recovery" ? (
          <TwoFactorRecoveryCodes codes={visibleCodes} onDone={handleClose} />
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
            onClose={handleClose}
            onReactivate={() => setView("setup")}
          />
        )}
      </div>
    </ModalShell>
  );
}
