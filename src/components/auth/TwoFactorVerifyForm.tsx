"use client";

import {
  hasErrors,
  RECOVERY_CODE_LENGTH,
  TWO_FACTOR_VERIFY_INSTRUCTIONS,
  type TwoFactorCodeErrors,
  validateTwoFactorCode,
} from "@discordia/client-shared";

import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { TextField } from "@/components/ui/TextField";
import { twoFactorVerifyRequest } from "@/services/two-factor/client";

interface TwoFactorVerifyFormProps {
  /** Vuelve al paso de email y contraseña: el desafío ya no sirve. */
  onChallengeLost: (message: string) => void;
  onVerified: (result: {
    recoveryCodeUsed: boolean;
    recoveryCodesRemaining: number;
  }) => void;
}

export function TwoFactorVerifyForm({
  onChallengeLost,
  onVerified,
}: TwoFactorVerifyFormProps) {
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<TwoFactorCodeErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    </form>
  );
}
