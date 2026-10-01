"use client";

import {
  hasErrors,
  normalizeTotpCode,
  TOTP_CODE_LENGTH,
  TWO_FACTOR_SCAN_INSTRUCTIONS,
  type TwoFactorCodeErrors,
  type TwoFactorSetup,
  validateTwoFactorActivationCode,
} from "@discordia/client-shared";

import { Check, Copy, KeyRound, Loader2, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { TextField } from "@/components/ui/TextField";
import {
  twoFactorActivateRequest,
  twoFactorSetupRequest,
} from "@/services/two-factor/client";

import { SetPasswordStep } from "./set-password-step";

interface TwoFactorSetupFormProps {
  onCancel: () => void;
  onActivated: (recoveryCodes: string[]) => void;
}

export function TwoFactorSetupForm({
  onCancel,
  onActivated,
}: TwoFactorSetupFormProps) {
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<TwoFactorCodeErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);

  const fetchSetup = useCallback(async () => {
    setIsLoading(true);
    setNeedsPassword(false);
    const result = await twoFactorSetupRequest();
    setIsLoading(false);
    if (result.ok) {
      setSetup(result.setup);
    } else if (result.passwordRequired) {
      setNeedsPassword(true);
    } else {
      setFormError(result.message);
    }
  }, []);

  useEffect(() => {
    void fetchSetup();
  }, [fetchSetup]);

  async function copySecret() {
    if (!setup) return;
    try {
      await navigator.clipboard.writeText(setup.secret);
      setSecretCopied(true);
      window.setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: la clave sigue disponible para
      // seleccionar y copiar a mano.
    }
  }

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

    onActivated(result.recoveryCodes);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2
          size={24}
          className="text-content-subtle animate-spin"
          aria-label="Cargando"
        />
      </div>
    );
  }

  if (needsPassword) {
    return <SetPasswordStep onCancel={onCancel} onPasswordReady={fetchSetup} />;
  }

  if (!setup) {
    return <FormAlert message={formError ?? undefined} />;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <h3 className="text-content font-display text-xl font-bold">
          Conectá tu app autenticadora
        </h3>
        <p className="text-content-muted mt-1 text-sm leading-relaxed">
          {TWO_FACTOR_SCAN_INSTRUCTIONS}
        </p>
      </div>

      <div className="bg-surface-raised border-line grid gap-6 rounded-2xl border p-5 sm:grid-cols-[180px_1fr] sm:items-center">
        <div className="flex justify-center">
          <div className="rounded-xl bg-white p-4">
            <QRCodeSVG
              value={setup.otpauth_url}
              size={160}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
              title="Código QR para la app autenticadora"
            />
          </div>
        </div>

        <div>
          <div className="text-info mb-3 flex items-center gap-2">
            <Smartphone size={18} />
            <span className="text-sm font-semibold">¿No podés escanear?</span>
          </div>
          <p className="text-content-subtle mb-2 text-xs">
            Ingresá esta clave manualmente. Si cerrás y volvés, seguirá siendo
            la misma.
          </p>
          <div className="bg-surface-input border-line text-content flex items-center justify-between gap-3 rounded-xl border px-3 py-3 font-mono text-sm">
            <span className="break-all">{setup.secret}</span>
            <button
              type="button"
              onClick={() => void copySecret()}
              aria-label="Copiar clave"
              className="text-info shrink-0 cursor-pointer"
            >
              {secretCopied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>

      <TextField
        label="Código de tu app"
        name="code"
        autoComplete="one-time-code"
        inputMode="numeric"
        placeholder="123456"
        maxLength={TOTP_CODE_LENGTH}
        icon={<KeyRound size={16} />}
        value={code}
        onChange={(event) => setCode(normalizeTotpCode(event.target.value))}
        error={errors.code}
        className="tracking-[0.3em]"
      />

      <FormAlert message={formError ?? undefined} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <span>Confirmar y activar</span>
        </Button>
      </div>
    </form>
  );
}
