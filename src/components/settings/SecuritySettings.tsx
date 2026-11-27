"use client";

import {
  ACCOUNT_PASSWORD_COPY,
  type TwoFactorStatus,
} from "@discordia/client-shared";

import { useState } from "react";

import { ChangePasswordForm } from "@/components/security/ChangePasswordForm";
import { PasswordSummaryRow } from "@/components/security/PasswordSummaryRow";
import {
  SetPasswordStep,
  type SetPasswordStepCopy,
} from "@/components/security/SetPasswordStep";
import { TwoFactorSummaryRow } from "@/components/security/TwoFactorSummaryRow";
import { FormAlert } from "@/components/ui/FormAlert";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SuccessDialog } from "@/components/ui/SuccessDialog";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { useOptionalOwnProfile } from "@/contexts/OwnProfileContext";

import { useTwoFactorStatus } from "./hooks/useTwoFactorStatus";

const SET_PASSWORD_COPY: SetPasswordStepCopy = {
  title: ACCOUNT_PASSWORD_COPY.setFormTitle,
  description: ACCOUNT_PASSWORD_COPY.setFormDescription,
  submitLabel: ACCOUNT_PASSWORD_COPY.submit,
  continueLabel: "Continuar",
};

type PasswordView = "change" | "set" | null;

interface PasswordSuccess {
  title: string;
  body: string;
}

const PASSWORD_CHANGED: PasswordSuccess = {
  title: ACCOUNT_PASSWORD_COPY.changedTitle,
  body: ACCOUNT_PASSWORD_COPY.changedBody,
};

const PASSWORD_SET: PasswordSuccess = {
  title: ACCOUNT_PASSWORD_COPY.setTitle,
  body: ACCOUNT_PASSWORD_COPY.setBody,
};

interface SecuritySettingsProps {
  onOpenTwoFactor: (status: TwoFactorStatus) => void;
}

export function SecuritySettings({ onOpenTwoFactor }: SecuritySettingsProps) {
  const ownProfile = useOptionalOwnProfile();
  const profile = ownProfile?.profile ?? null;
  const [passwordView, setPasswordView] = useState<PasswordView>(null);
  const [success, setSuccess] = useState<PasswordSuccess | null>(null);
  const twoFactor = useTwoFactorStatus();

  function openPassword() {
    setPasswordView(profile?.has_password ? "change" : "set");
  }

  function finishPassword(result: PasswordSuccess) {
    setPasswordView(null);
    setSuccess(result);
    void ownProfile?.refresh();
  }

  if (passwordView === "change") {
    return (
      <ChangePasswordForm
        onCancel={() => setPasswordView(null)}
        onChanged={() => finishPassword(PASSWORD_CHANGED)}
        onPasswordNotSet={() => {
          setPasswordView("set");
          void ownProfile?.refresh();
        }}
      />
    );
  }

  if (passwordView === "set") {
    return (
      <SetPasswordStep
        copy={SET_PASSWORD_COPY}
        onCancel={() => setPasswordView(null)}
        onPasswordReady={() => finishPassword(PASSWORD_SET)}
      />
    );
  }

  const isLoading = twoFactor.isLoading || (ownProfile !== null && !profile);

  return (
    <SettingsSection description="Administrá las medidas que protegen tu cuenta.">
      {success ? (
        <SuccessDialog
          title={success.title}
          body={success.body}
          onClose={() => setSuccess(null)}
        />
      ) : null}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          {twoFactor.status ? (
            <TwoFactorSummaryRow
              status={twoFactor.status}
              onOpen={onOpenTwoFactor}
            />
          ) : (
            <FormAlert message={twoFactor.loadError ?? undefined} />
          )}
          {profile ? (
            <PasswordSummaryRow
              hasPassword={profile.has_password}
              onOpen={openPassword}
            />
          ) : null}
        </div>
      )}
    </SettingsSection>
  );
}
