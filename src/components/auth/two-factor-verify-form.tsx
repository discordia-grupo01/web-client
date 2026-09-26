"use client";

import {
  hasErrors,
  TOTP_CODE_LENGTH,
  TWO_FACTOR_VERIFY_INSTRUCTIONS,
  type TwoFactorCodeErrors,
  validateTwoFactorCode,
} from "@discordia/client-shared";

import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { TextField } from "@/components/ui/text-field";
import { twoFactorVerifyRequest } from "@/services/two-factor/client";

interface TwoFactorVerifyFormProps {
  /** Vuelve al paso de email y contraseña: el desafío ya no sirve. */
  onChallengeLost: (message: string) => void;
  onVerified: (result: {
    recoveryCodeUsed: boolean;
    recoveryCodesRemaining: number;
  }) => void;
}

/**
 * Segundo paso del login (CA2). El mismo campo acepta el código de la app y
 * uno de recuperación (CA4): el usuario escribe lo que tenga a mano y es el
 * backend el que los distingue por el formato.
 */
export function TwoFactorVerifyForm({
  onChallengeLost,
  onVerified,
}: TwoFactorVerifyFormProps) {
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<TwoFactorCodeErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateTwoFactorCode({ code });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    const result = await twoFactorVerifyRequest(code.trim());
    setIsSubmitting(false);

    if (!result.ok) {
      // CA3: con el desafío todavía vivo se reintenta acá mismo. Si se quemó
      // (vencido o demasiados intentos), no tiene sentido dejarlo tipeando.
      if (result.expired) {
        onChallengeLost(result.message);
        return;
      }
      setCode("");
      setFormError(result.message);
      return;
    }

    onVerified({
      recoveryCodeUsed: result.recoveryCodeUsed,
      recoveryCodesRemaining: result.recoveryCodesRemaining,
    });
  }

  /**
   * Cambiar de modo es solo un cambio de ayuda visual: el endpoint es el
   * mismo. Por eso limpia el campo pero no toca nada del desafío.
   */
  function toggleRecoveryCode() {
    setUseRecoveryCode((previous) => !previous);
    setCode("");
    setErrors({});
    setFormError(null);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="border-info/30 bg-info/10 flex items-start gap-3 rounded-xl border px-4 py-3">
        <ShieldCheck size={16} className="text-info mt-0.5 shrink-0" />
        <p className="text-content-muted text-xs leading-relaxed">
          {useRecoveryCode
            ? "Ingresá uno de los códigos de recuperación que guardaste al activar el segundo factor. Cada uno sirve una sola vez."
            : TWO_FACTOR_VERIFY_INSTRUCTIONS}
        </p>
      </div>

      <TextField
        label={useRecoveryCode ? "Código de recuperación" : "Código"}
        name="code"
        // `one-time-code` es lo que hace que iOS y Android ofrezcan pegar el
        // código; en modo recuperación no aplica, sale de un gestor o un papel.
        autoComplete={useRecoveryCode ? "off" : "one-time-code"}
        inputMode={useRecoveryCode ? "text" : "numeric"}
        placeholder={useRecoveryCode ? "A1B2C-D3E4F" : "123456"}
        maxLength={useRecoveryCode ? 11 : TOTP_CODE_LENGTH}
        autoFocus
        icon={<KeyRound size={16} />}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        error={errors.code}
        className={useRecoveryCode ? "tracking-widest" : "tracking-[0.3em]"}
      />

      <FormAlert message={formError ?? undefined} />

      <Button type="submit" isLoading={isSubmitting} className="mt-2">
        <span>Verificar</span>
        <ArrowRight size={16} />
      </Button>

      <button
        type="button"
        onClick={toggleRecoveryCode}
        className="text-info w-full cursor-pointer text-center text-xs transition-colors hover:underline"
      >
        {useRecoveryCode
          ? "Volver al código de la app"
          : "No tengo acceso a mi app autenticadora"}
      </button>
    </form>
  );
}
