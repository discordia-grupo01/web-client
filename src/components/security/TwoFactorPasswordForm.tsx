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
import { SettingsFormFooter } from "@/components/ui/settings/SettingsFormFooter";
import { SettingsStep } from "@/components/ui/settings/SettingsStep";

import { TWO_FACTOR_TITLE } from "./securityCopy";

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
      className="flex min-h-0 flex-1 flex-col"
    >
      <SettingsStep
        parent={TWO_FACTOR_TITLE}
        title={title}
        description={description}
        onBack={onCancel}
        footer={
          <SettingsFormFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-auto px-4 py-2"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={danger ? "danger" : "primary"}
              isLoading={isSubmitting}
              className="w-auto px-4 py-2"
            >
              {confirmLabel}
            </Button>
          </SettingsFormFooter>
        }
      >
        <div className="space-y-5">
          <PasswordField
            label="Contraseña"
            requiredMark
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
        </div>
      </SettingsStep>
    </form>
  );
}
