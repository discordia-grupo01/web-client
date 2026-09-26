"use client";

import {
  TWO_FACTOR_RECOVERY_CODES_TITLE,
  twoFactorRecoveryCodesRemaining,
  type TwoFactorStatus,
} from "@discordia/client-shared";

import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { ModalShell } from "@/components/ui/modal-shell";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";
import {
  twoFactorDisableRequest,
  twoFactorRegenerateCodesRequest,
  twoFactorStatusRequest,
} from "@/services/two-factor/client";

import { RecoveryCodesList } from "./recovery-codes-list";
import { TwoFactorPasswordModal } from "./two-factor-password-modal";
import { TwoFactorSetupModal } from "./two-factor-setup-modal";

type OpenModal = "setup" | "disable" | "regenerate" | "codes" | null;

export function TwoFactorSection() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  const loadStatus = useCallback(async () => {
    const result = await twoFactorStatusRequest();
    setIsLoading(false);
    if (result.ok) {
      setStatus(result.status);
      setLoadError(null);
    } else {
      setLoadError(result.message);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function handleDisable(password: string): Promise<string | null> {
    const result = await twoFactorDisableRequest(password);
    if (!result.ok) return result.message;

    setOpenModal(null);
    await loadStatus();
    return null;
  }

  async function handleRegenerate(password: string): Promise<string | null> {
    const result = await twoFactorRegenerateCodesRequest(password);
    if (!result.ok) return result.message;

    setNewCodes(result.recoveryCodes);
    setOpenModal("codes");
    await loadStatus();
    return null;
  }

  const enabled = status?.enabled ?? false;

  return (
    <div className="space-y-3">
      <SectionLabel>Verificación en dos pasos</SectionLabel>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2
            size={18}
            className="text-content-subtle animate-spin"
            aria-label="Cargando"
          />
        </div>
      ) : loadError ? (
        <FormAlert message={loadError} />
      ) : (
        <>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 shrink-0",
                enabled ? "text-success" : "text-content-subtle",
              )}
              aria-hidden="true"
            >
              {enabled ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
            </span>
            <div className="space-y-1">
              <p className="text-content text-sm font-medium">
                {enabled ? "Activada" : "Desactivada"}
              </p>
              <p className="text-content-muted text-xs leading-relaxed">
                {enabled
                  ? "Al iniciar sesión te vamos a pedir el código de tu app autenticadora."
                  : "Sumá un código de tu teléfono al iniciar sesión, para que tu contraseña sola no alcance para entrar."}
              </p>
              {enabled ? (
                <p
                  className={cn(
                    "text-xs",
                    status && status.recovery_codes_remaining <= 2
                      ? "text-highlight"
                      : "text-content-subtle",
                  )}
                >
                  {twoFactorRecoveryCodesRemaining(
                    status?.recovery_codes_remaining ?? 0,
                  )}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {enabled ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpenModal("regenerate")}
                  className="w-auto px-3 py-2 text-xs"
                >
                  Generar códigos nuevos
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpenModal("disable")}
                  className="w-auto px-3 py-2 text-xs"
                >
                  Desactivar
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setOpenModal("setup")}
                className="w-auto px-3 py-2 text-xs"
              >
                Activar
              </Button>
            )}
          </div>
        </>
      )}

      {openModal === "setup" ? (
        <TwoFactorSetupModal
          onClose={() => {
            setOpenModal(null);
            void loadStatus();
          }}
          onActivated={loadStatus}
        />
      ) : null}

      {openModal === "disable" ? (
        <TwoFactorPasswordModal
          title="Desactivar verificación en dos pasos"
          description="Reingresá tu contraseña para confirmar. Después de esto solo te vamos a pedir tu contraseña para entrar."
          confirmLabel="Desactivar"
          onClose={() => setOpenModal(null)}
          onConfirm={handleDisable}
        />
      ) : null}

      {openModal === "regenerate" ? (
        <TwoFactorPasswordModal
          title="Generar códigos nuevos"
          description="Reingresá tu contraseña. Los códigos que tengas anotados dejan de servir en cuanto se genere la lista nueva."
          confirmLabel="Generar"
          onClose={() => setOpenModal(null)}
          onConfirm={handleRegenerate}
        />
      ) : null}

      {openModal === "codes" && newCodes ? (
        <ModalShell
          onClose={() => setOpenModal(null)}
          labelledBy="two-factor-new-codes-title"
          maxWidth={440}
        >
          <div className="space-y-5 overflow-y-auto p-6">
            <h2
              id="two-factor-new-codes-title"
              className="font-display text-content text-lg font-semibold"
            >
              {TWO_FACTOR_RECOVERY_CODES_TITLE}
            </h2>
            <RecoveryCodesList codes={newCodes} />
            <Button type="button" onClick={() => setOpenModal(null)}>
              Ya los guardé
            </Button>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
