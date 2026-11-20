"use client";

import {
  ACCOUNT_PASSWORD_COPY,
  type ChangePasswordErrors,
  hasErrors,
  validateChangePassword,
} from "@discordia/client-shared";

import { Lock } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { PasswordField } from "@/components/ui/PasswordField";
import { SettingsFormFooter } from "@/components/ui/settings/SettingsFormFooter";
import { SettingsStep } from "@/components/ui/settings/SettingsStep";
import { changePasswordRequest } from "@/services/auth/client";

import { SECURITY_TITLE } from "./securityCopy";

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
      className="flex min-h-0 flex-1 flex-col"
    >
      <SettingsStep
        parent={SECURITY_TITLE}
        title={ACCOUNT_PASSWORD_COPY.changeFormTitle}
        description={ACCOUNT_PASSWORD_COPY.changeFormDescription}
        onBack={onCancel}
        footer={
          <SettingsFormFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="w-auto px-4 py-2"
            >
              {ACCOUNT_PASSWORD_COPY.cancel}
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-auto px-4 py-2"
            >
              <span>{ACCOUNT_PASSWORD_COPY.submit}</span>
            </Button>
          </SettingsFormFooter>
        }
      >
        <div className="space-y-5">
          <PasswordField
            label={ACCOUNT_PASSWORD_COPY.currentPasswordLabel}
            labelVariant="sentence"
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
            labelVariant="sentence"
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
            labelVariant="sentence"
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
        </div>
      </SettingsStep>
    </form>
  );
}
