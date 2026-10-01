"use client";

import {
  hasErrors,
  type TwoFactorPasswordErrors,
  validateTwoFactorPassword,
} from "@discordia/client-shared";

import { Lock } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { PasswordField } from "@/components/ui/PasswordField";

interface TwoFactorPasswordFormProps {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: (password: string) => Promise<string | null>;
}

export function TwoFactorPasswordForm({
  title,
  description,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}: TwoFactorPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<TwoFactorPasswordErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateTwoFactorPassword({ password });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    const message = await onConfirm(password);
    setIsSubmitting(false);

    if (message) {
      setPassword("");
      setFormError(message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto max-w-md space-y-5"
    >
      <div>
        <h3
          className={
            danger
              ? "text-danger font-display text-xl font-bold"
              : "text-content font-display text-xl font-bold"
          }
        >
          {title}
        </h3>
        <p className="text-content-muted mt-1 text-sm leading-relaxed">
          {description}
        </p>
      </div>

      <PasswordField
        label="Contraseña"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        autoFocus
        icon={<Lock size={16} />}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
      />

      <FormAlert message={formError ?? undefined} />

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant={danger ? "danger" : "primary"}
          isLoading={isSubmitting}
        >
          {confirmLabel}
        </Button>
      </div>
    </form>
  );
}
