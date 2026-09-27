"use client";

import {
  hasErrors,
  TOTP_CODE_LENGTH,
  TWO_FACTOR_SCAN_INSTRUCTIONS,
  type TwoFactorCodeErrors,
  type TwoFactorSetup,
  validateTwoFactorActivationCode,
} from "@discordia/client-shared";

import { KeyRound, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { SectionLabel } from "@/components/ui/section-label";
import { TextField } from "@/components/ui/text-field";
import {
  twoFactorActivateRequest,
  twoFactorSetupRequest,
} from "@/services/two-factor/client";

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

        <div className="space-y-1.5">
          <SectionLabel>Clave para ingresar a mano</SectionLabel>
          <p className="bg-surface-input border-line text-content rounded-xl border px-4 py-3 text-center font-mono text-sm break-all">
            {setup.secret}
          </p>
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
        onChange={(event) => setCode(event.target.value)}
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
