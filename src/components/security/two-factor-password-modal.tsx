"use client";

import {
  hasErrors,
  type TwoFactorPasswordErrors,
  validateTwoFactorPassword,
} from "@discordia/client-shared";

import { Lock } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { ModalShell } from "@/components/ui/modal-shell";
import { PasswordField } from "@/components/ui/password-field";

interface TwoFactorPasswordModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (password: string) => Promise<string | null>;
}

export function TwoFactorPasswordModal({
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
}: TwoFactorPasswordModalProps) {
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
    <ModalShell onClose={onClose} labelledBy="two-factor-password-title">
      <form onSubmit={handleSubmit} noValidate className="space-y-5 p-6">
        <div className="space-y-2">
          <h2
            id="two-factor-password-title"
            className="font-display text-content text-lg font-semibold"
          >
            {title}
          </h2>
          <p className="text-content-muted text-sm leading-relaxed">
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

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
