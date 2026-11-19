"use client";

import {
  ACCOUNT_PASSWORD_COPY,
  type TwoFactorStatus,
} from "@discordia/client-shared";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { ChangePasswordForm } from "@/components/security/ChangePasswordForm";
import { PasswordSummaryRow } from "@/components/security/PasswordSummaryRow";
import {
  SetPasswordStep,
  type SetPasswordStepCopy,
} from "@/components/security/SetPasswordStep";
import { TwoFactorSummaryRow } from "@/components/security/TwoFactorSummaryRow";
import { useOptionalOwnProfile } from "@/contexts/OwnProfileContext";

const SET_PASSWORD_COPY: SetPasswordStepCopy = {
  title: ACCOUNT_PASSWORD_COPY.setFormTitle,
  description: ACCOUNT_PASSWORD_COPY.setFormDescription,
  submitLabel: ACCOUNT_PASSWORD_COPY.submit,
  continueLabel: "Continuar",
};

type PasswordView = "change" | "set" | null;

interface SecuritySettingsProps {
  onOpenTwoFactor: (status: TwoFactorStatus) => void;
}

export function SecuritySettings({ onOpenTwoFactor }: SecuritySettingsProps) {
  const ownProfile = useOptionalOwnProfile();
  const profile = ownProfile?.profile ?? null;
  const [passwordView, setPasswordView] = useState<PasswordView>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function openPassword() {
    setNotice(null);
    setPasswordView(profile?.has_password ? "change" : "set");
  }

  function finishPassword(message: string | null) {
    setPasswordView(null);
    setNotice(message);
    void ownProfile?.refresh();
  }

  if (passwordView === "change") {
    return (
      <ChangePasswordForm
        onCancel={() => setPasswordView(null)}
        onChanged={() => finishPassword(ACCOUNT_PASSWORD_COPY.changed)}
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
        onPasswordReady={() => finishPassword(ACCOUNT_PASSWORD_COPY.set)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h3 className="text-content font-display text-xl font-bold">
          Seguridad y acceso
        </h3>
        <p className="text-content-muted mt-1 text-sm">
          Administrá las medidas que protegen tu cuenta.
        </p>
      </div>
      {notice ? (
        <div
          role="status"
          className="border-success/30 bg-success/10 text-success mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}
      <div className="space-y-3">
        <TwoFactorSummaryRow onOpen={onOpenTwoFactor} />
        {profile ? (
          <PasswordSummaryRow
            hasPassword={profile.has_password}
            onOpen={openPassword}
          />
        ) : null}
      </div>
    </div>
  );
}
