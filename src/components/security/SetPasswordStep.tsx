"use client";

import {
  hasErrors,
  type SetPasswordErrors,
  validateSetPassword,
} from "@discordia/client-shared";

import { ArrowRight, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { PasswordField } from "@/components/ui/PasswordField";
import { SettingsFormFooter } from "@/components/ui/settings/SettingsFormFooter";
import { SettingsStep } from "@/components/ui/settings/SettingsStep";
import { setPasswordRequest } from "@/services/auth/client";

import { SECURITY_TITLE } from "./securityCopy";

export interface SetPasswordStepCopy {
  title: string;
  description: string;
  submitLabel: string;
  continueLabel: string;
}

const TWO_FACTOR_COPY: SetPasswordStepCopy = {
  title: "Creá una contraseña primero",
  description:
    "Tu cuenta usa Google y todavía no tiene una contraseña propia. La vas a necesitar para recuperar códigos o desactivar el segundo factor más adelante.",
  submitLabel: "Guardar y continuar",
  continueLabel: "Continuar al QR",
};

interface SetPasswordStepProps {
  onCancel: () => void;
  onPasswordReady: () => void;
  copy?: SetPasswordStepCopy;
}

export function SetPasswordStep({
  onCancel,
  onPasswordReady,
  copy = TWO_FACTOR_COPY,
}: SetPasswordStepProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<SetPasswordErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [alreadySet, setAlreadySet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateSetPassword({ password, confirmPassword });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    const result = await setPasswordRequest({ password, confirmPassword });
    setIsSubmitting(false);

    if (!result.ok) {
      // Carrera entre pestañas/dispositivos: la cuenta ya consiguió una
      // contraseña mientras se completaba este paso. No es un error que
      // bloquee: se puede seguir al paso siguiente.
      if (result.alreadySet) {
        setAlreadySet(true);
        setFormError(result.message);
        return;
      }
      setFormError(result.message);
      return;
    }

    onPasswordReady();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <SettingsStep
        parent={SECURITY_TITLE}
        title={copy.title}
        description={copy.description}
        onBack={onCancel}
        footer={
          <SettingsFormFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="w-auto px-4 py-2"
            >
              Cancelar
            </Button>
            {alreadySet ? (
              <Button
                type="button"
                onClick={onPasswordReady}
                className="w-auto px-4 py-2"
              >
                <span>{copy.continueLabel}</span>
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-auto px-4 py-2"
              >
                <span>{copy.submitLabel}</span>
              </Button>
            )}
          </SettingsFormFooter>
        }
      >
        <div className="space-y-5">
          <PasswordField
            label="Nueva contraseña"
            labelVariant="sentence"
            name="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            icon={<Lock size={16} />}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFormError(null);
            }}
            error={errors.password}
            autoFocus
          />

          <PasswordField
            label="Confirmar contraseña"
            labelVariant="sentence"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repetí la contraseña"
            icon={<Lock size={16} />}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setFormError(null);
            }}
            error={errors.confirmPassword}
          />

          <FormAlert message={formError ?? undefined} />
        </div>
      </SettingsStep>
    </form>
  );
}
