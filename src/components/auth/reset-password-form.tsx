"use client";

import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { resetPasswordRequest } from "@/features/auth/client";
import {
  hasErrors,
  validateResetPassword,
  type ResetPasswordErrors,
} from "@/features/auth/validation";
import { ROUTES } from "@/lib/constants";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // El link del mail siempre trae `?token=...`; sin el, no hay nada que resetear.
  if (token === "") {
    return (
      <div className="text-center">
        <h1 className="font-display text-content mb-2 text-2xl font-bold">
          Enlace inválido
        </h1>
        <p className="text-content-muted mb-6 text-sm leading-relaxed">
          Este enlace de recuperación no es válido o ya expiró. Solicita uno
          nuevo para continuar.
        </p>
        <Link
          href={ROUTES.forgotPassword}
          className="text-sky text-sm font-medium hover:underline"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateResetPassword({
      newPassword,
      confirmPassword,
    });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    const result = await resetPasswordRequest({
      token,
      newPassword,
      confirmPassword,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    // No hay sesion nueva: el reset no devuelve token, hay que loguearse de nuevo.
    router.replace(`${ROUTES.login}?reset=success`);
  }

  return (
    <>
      <h1 className="font-display text-content mb-1 text-2xl font-bold">
        Nueva contraseña
      </h1>
      <p className="text-content-muted mb-7 text-sm">
        Elige una contraseña segura para tu cuenta. Mínimo 8 caracteres.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <PasswordField
          label="Nueva contraseña"
          name="newPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={errors.newPassword}
        />

        <PasswordField
          label="Confirmar contraseña"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
        />

        {formError ? (
          <p
            role="alert"
            className="border-danger/30 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-xs"
          >
            {formError}
          </p>
        ) : null}

        <Button type="submit" isLoading={isSubmitting} className="mt-2">
          <span>Actualizar contraseña</span>
          <ArrowRight size={16} />
        </Button>
      </form>
    </>
  );
}
