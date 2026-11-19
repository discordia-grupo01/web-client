"use client";

import {
  ACCOUNT_PASSWORD_COPY,
  type ChangePasswordErrors,
  hasErrors,
  validateChangePassword,
} from "@discordia/client-shared";

import { KeyRound, Lock } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { PasswordField } from "@/components/ui/PasswordField";
import { changePasswordRequest } from "@/services/auth/client";

interface ChangePasswordFormProps {
  onCancel: () => void;
  onChanged: () => void;
  onPasswordNotSet: () => void;
}

export function ChangePasswordForm({
  onCancel,
  onChanged,
  onPasswordNotSet,
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ChangePasswordErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const values = { currentPassword, newPassword, confirmPassword };
    const nextErrors = validateChangePassword(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    const result = await changePasswordRequest(values);
    setIsSubmitting(false);

    if (result.ok) {
      onChanged();
      return;
    }
    if (result.passwordNotSet) {
      onPasswordNotSet();
      return;
    }
    setFormError(result.message);
  }

  function clearFormError() {
    setFormError(null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto max-w-md space-y-5"
    >
      <div className="text-center">
        <div className="bg-info/15 border-info/35 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border">
          <KeyRound size={26} className="text-info" />
        </div>
        <h3 className="text-content font-display text-xl font-bold">
          {ACCOUNT_PASSWORD_COPY.changeFormTitle}
        </h3>
        <p className="text-content-muted mt-2 text-sm leading-relaxed">
          {ACCOUNT_PASSWORD_COPY.changeFormDescription}
        </p>
      </div>

      <PasswordField
        label={ACCOUNT_PASSWORD_COPY.currentPasswordLabel}
        name="currentPassword"
        autoComplete="current-password"
        icon={<Lock size={16} />}
        value={currentPassword}
        onChange={(event) => {
          setCurrentPassword(event.target.value);
          clearFormError();
        }}
        error={errors.currentPassword}
        autoFocus
      />

      <PasswordField
        label={ACCOUNT_PASSWORD_COPY.newPasswordLabel}
        name="newPassword"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        icon={<Lock size={16} />}
        value={newPassword}
        onChange={(event) => {
          setNewPassword(event.target.value);
          clearFormError();
        }}
        error={errors.newPassword}
      />

      <PasswordField
        label={ACCOUNT_PASSWORD_COPY.confirmPasswordLabel}
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Repetí la contraseña"
        icon={<Lock size={16} />}
        value={confirmPassword}
        onChange={(event) => {
          setConfirmPassword(event.target.value);
          clearFormError();
        }}
        error={errors.confirmPassword}
      />

      <FormAlert message={formError ?? undefined} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {ACCOUNT_PASSWORD_COPY.cancel}
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          <span>{ACCOUNT_PASSWORD_COPY.submit}</span>
        </Button>
      </div>
    </form>
  );
}
