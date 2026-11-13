"use client";

import {
  ACCOUNT_RECOVERY_DELAY_WARNING,
  ACCOUNT_RECOVERY_DESCRIPTION,
  ACCOUNT_RECOVERY_MESSAGE_MAX_LENGTH,
  ACCOUNT_RECOVERY_MESSAGE_PLACEHOLDER,
  type AccountRecoveryErrors,
  accountRecoveryMessageLength,
  hasErrors,
  validateAccountRecovery,
} from "@discordia/client-shared";

import { ArrowLeft, ArrowRight, TriangleAlert } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AutoGrowTextarea } from "@/components/ui/AutoGrowTextarea";
import { Button } from "@/components/ui/Button";
import { CharacterCounter } from "@/components/ui/CharacterCounter";
import { FieldError } from "@/components/ui/FieldError";
import { FormAlert } from "@/components/ui/FormAlert";
import { cn } from "@/lib/cn";
import { twoFactorRecoveryRequest } from "@/services/two-factor/client";

const MESSAGE_ID = "account-recovery-message";

interface RecoveryRequestFormProps {
  onCancel: () => void;
  onSent: (emailHint: string) => void;
  onAlreadyPending: () => void;
  onChallengeLost: (message: string) => void;
}

export function RecoveryRequestForm({
  onCancel,
  onSent,
  onAlreadyPending,
  onChallengeLost,
}: RecoveryRequestFormProps) {
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<AccountRecoveryErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateAccountRecovery({ message });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    const result = await twoFactorRecoveryRequest(message.trim());
    setIsSubmitting(false);

    if (!result.ok) {
      if (result.expired) {
        onChallengeLost(result.message);
        return;
      }
      setFormError(result.message);
      return;
    }

    if ("alreadyPending" in result) {
      onAlreadyPending();
      return;
    }
    onSent(result.emailHint);
  }

  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="text-content-subtle mb-6 flex cursor-pointer items-center gap-1.5 text-sm transition-colors hover:opacity-80"
      >
        <ArrowLeft size={14} />
        Volver a la verificación
      </button>

      <h1 className="font-display text-content mb-1 text-2xl font-bold">
        Recuperar acceso a tu cuenta
      </h1>
      <p className="text-content-muted mb-7 text-sm leading-relaxed">
        {ACCOUNT_RECOVERY_DESCRIPTION}
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="border-warning/30 bg-warning/10 flex items-start gap-3 rounded-xl border px-4 py-3">
          <TriangleAlert size={16} className="text-warning mt-0.5 shrink-0" />
          <p className="text-content-muted text-xs leading-relaxed">
            {ACCOUNT_RECOVERY_DELAY_WARNING}
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor={MESSAGE_ID}
              className="text-content-subtle text-xs font-semibold tracking-wider uppercase"
            >
              Contanos qué pasó{" "}
              <span className="font-normal normal-case">(opcional)</span>
            </label>
            <CharacterCounter
              length={accountRecoveryMessageLength(message)}
              max={ACCOUNT_RECOVERY_MESSAGE_MAX_LENGTH}
            />
          </div>
          <AutoGrowTextarea
            id={MESSAGE_ID}
            value={message}
            maxHeight={200}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={ACCOUNT_RECOVERY_MESSAGE_PLACEHOLDER}
            aria-invalid={errors.message ? true : undefined}
            className={cn(
              "bg-surface-input text-content placeholder:text-content-subtle focus:border-accent min-h-[6rem] w-full rounded-xl border p-3 text-sm outline-none",
              errors.message ? "border-danger" : "border-line",
            )}
          />
          <FieldError message={errors.message} />
        </div>

        <FormAlert message={formError ?? undefined} />

        <Button type="submit" isLoading={isSubmitting} className="mt-2">
          <span>Enviar solicitud</span>
          <ArrowRight size={16} />
        </Button>
      </form>
    </>
  );
}
