"use client";

import {
  hasErrors,
  TOTP_CODE_LENGTH,
  TWO_FACTOR_RECOVERY_CODES_TITLE,
  TWO_FACTOR_SCAN_INSTRUCTIONS,
  type TwoFactorCodeErrors,
  type TwoFactorSetup,
  validateTwoFactorActivationCode,
} from "@discordia/client-shared";

import { Check, KeyRound, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { ModalShell } from "@/components/ui/modal-shell";
import { SectionLabel } from "@/components/ui/section-label";
import { TextField } from "@/components/ui/text-field";
import {
  twoFactorActivateRequest,
  twoFactorSetupRequest,
} from "@/services/two-factor/client";

import { RecoveryCodesList } from "./recovery-codes-list";

interface TwoFactorSetupModalProps {
  onClose: () => void;
  /** Se llama cuando el 2FA quedó activo, para refrescar el estado de la sección. */
  onActivated: () => void;
}

export function TwoFactorSetupModal({
  onClose,
  onActivated,
}: TwoFactorSetupModalProps) {
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<TwoFactorCodeErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    void twoFactorSetupRequest().then((result) => {
      if (!active) return;
      setIsLoading(false);
      if (result.ok) {
        setSetup(result.setup);
      } else {
        setFormError(result.message);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateTwoFactorActivationCode({ code });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    const result = await twoFactorActivateRequest(code.trim());
    setIsSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setRecoveryCodes(result.recoveryCodes);
    onActivated();
  }

  return (
    <ModalShell
      onClose={onClose}
      labelledBy="two-factor-setup-title"
      maxWidth={440}
    >
      <div className="space-y-5 overflow-y-auto p-6">
        <h2
          id="two-factor-setup-title"
          className="font-display text-content text-lg font-semibold"
        >
          {recoveryCodes
            ? TWO_FACTOR_RECOVERY_CODES_TITLE
            : "Activar verificación en dos pasos"}
        </h2>

        {recoveryCodes ? (
          <>
            <RecoveryCodesList codes={recoveryCodes} />
            <Button type="button" onClick={onClose}>
              <Check size={16} />
              <span>Ya los guardé</span>
            </Button>
          </>
        ) : isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2
              size={24}
              className="text-content-subtle animate-spin"
              aria-label="Cargando"
            />
          </div>
        ) : setup ? (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <p className="text-content-muted text-sm leading-relaxed">
              {TWO_FACTOR_SCAN_INSTRUCTIONS}
            </p>

            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-4">
                <QRCodeSVG
                  value={setup.otpauth_url}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  title="Código QR para la app autenticadora"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>Clave para ingresar a mano</SectionLabel>
              <p className="bg-surface-input border-line text-content rounded-xl border px-4 py-3 text-center font-mono text-sm break-all">
                {setup.secret}
              </p>
            </div>

            <div className="bg-line h-px" />

            <TextField
              label="Código de tu app"
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder="123456"
              maxLength={TOTP_CODE_LENGTH}
              icon={<KeyRound size={16} />}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              error={errors.code}
              className="tracking-[0.3em]"
            />

            <FormAlert message={formError ?? undefined} />

            <Button type="submit" isLoading={isSubmitting}>
              <span>Activar</span>
            </Button>
          </form>
        ) : (
          <FormAlert message={formError ?? undefined} />
        )}
      </div>
    </ModalShell>
  );
}
