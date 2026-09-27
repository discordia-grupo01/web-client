"use client";

import {
  hasErrors,
  type SetPasswordErrors,
  validateSetPassword,
} from "@discordia/client-shared";

import { ArrowRight, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { PasswordField } from "@/components/ui/password-field";
import { setPasswordRequest } from "@/services/auth/client";

interface SetPasswordStepProps {
  onCancel: () => void;
  onPasswordReady: () => void;
}

export function SetPasswordStep({
  onCancel,
  onPasswordReady,
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
      // bloquee -- se puede seguir directo al QR.
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
      className="mx-auto max-w-md space-y-5"
    >
      <div className="text-center">
        <div className="bg-info/15 border-info/35 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border">
          <Lock size={26} className="text-info" />
        </div>
        <h3 className="text-content font-display text-xl font-bold">
          Creá una contraseña primero
        </h3>
        <p className="text-content-muted mt-2 text-sm leading-relaxed">
          Tu cuenta usa Google y todavía no tiene una contraseña propia. La vas
          a necesitar para recuperar códigos o desactivar el segundo factor más
          adelante.
        </p>
      </div>

      <PasswordField
        label="Nueva contraseña"
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

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        {alreadySet ? (
          <Button type="button" onClick={onPasswordReady}>
            <span>Continuar al QR</span>
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button type="submit" isLoading={isSubmitting}>
            <span>Guardar y continuar</span>
          </Button>
        )}
      </div>
    </form>
  );
}
