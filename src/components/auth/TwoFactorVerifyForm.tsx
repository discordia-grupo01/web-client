"use client";

import {
  formatTwoFactorChallengeCountdown,
  hasErrors,
  RECOVERY_CODE_LENGTH,
  TWO_FACTOR_CHALLENGE_EXPIRED,
  TWO_FACTOR_VERIFY_INSTRUCTIONS,
  type TwoFactorCodeErrors,
  validateTwoFactorCode,
} from "@discordia/client-shared";

import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { TextField } from "@/components/ui/TextField";
import { twoFactorVerifyRequest } from "@/services/two-factor/client";

interface TwoFactorVerifyFormProps {
  /** Segundos de validez del desafío, del backend (no un timer inventado). */
  expiresIn: number;
  /** Vuelve al paso de email y contraseña: el desafío ya no sirve. */
  onChallengeLost: (message: string) => void;
  onVerified: (result: {
    recoveryCodeUsed: boolean;
    recoveryCodesRemaining: number;
  }) => void;
}

/**
 * Segundo paso del login (CA2). Un solo campo acepta el código de la app y
 * uno de recuperación (CA4): el usuario escribe lo que tenga a mano y es el
 * backend el que los distingue por el formato.
 */
export function TwoFactorVerifyForm({
  expiresIn,
  onChallengeLost,
  onVerified,
}: TwoFactorVerifyFormProps) {
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<TwoFactorCodeErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(expiresIn);
  const onChallengeLostRef = useRef(onChallengeLost);
  useEffect(() => {
    onChallengeLostRef.current = onChallengeLost;
  }, [onChallengeLost]);

  // El aviso al padre va afuera del updater de `setSecondsLeft` (no se puede
  // notificar a un padre que desmonta este componente desde ahi adentro).
  useEffect(() => {
    if (expiresIn <= 0) {
      onChallengeLostRef.current(TWO_FACTOR_CHALLENGE_EXPIRED);
      return;
    }

    let remaining = expiresIn;
    const interval = window.setInterval(() => {
      remaining -= 1;
      setSecondsLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        window.clearInterval(interval);
        onChallengeLostRef.current(TWO_FACTOR_CHALLENGE_EXPIRED);
      }
    }, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="border-info/30 bg-info/10 flex items-start gap-3 rounded-xl border px-4 py-3">
        <ShieldCheck size={16} className="text-info mt-0.5 shrink-0" />
        <p className="text-content-muted text-xs leading-relaxed">
          {TWO_FACTOR_VERIFY_INSTRUCTIONS}
        </p>
      </div>

      <TextField
        label="Código de seguridad"
        name="code"
        autoComplete="one-time-code"
        placeholder="123456 o A1B2C-D3E4F"
        maxLength={RECOVERY_CODE_LENGTH + 1}
        autoFocus
        icon={<KeyRound size={16} />}
        value={code}
        onChange={(event) => setCode(event.target.value)}
        error={errors.code}
        className="tracking-widest"
      />

      <FormAlert message={formError ?? undefined} />

      <Button type="submit" isLoading={isSubmitting} className="mt-2">
        <span>Verificar</span>
        <ArrowRight size={16} />
      </Button>

      <p className="text-content-subtle flex items-center justify-between text-xs">
        <span>Sesión aún no iniciada</span>
        <span className="font-mono tabular-nums">
          {formatTwoFactorChallengeCountdown(secondsLeft)}
        </span>
      </p>
    </form>
  );
}
