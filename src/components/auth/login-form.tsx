"use client";

import {
  hasErrors,
  type LoginErrors,
  validateLogin,
} from "@discordia/client-shared";

import { ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { loginRequest } from "@/services/auth/client";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resetSuccess = searchParams.get("reset") === "success";
  const justRegistered = searchParams.get("registered") === "1";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    const result = await loginRequest({ email: email.trim(), password });
    setIsSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    const next = searchParams.get("next");
    window.location.href = next && next.startsWith("/") ? next : ROUTES.home;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {resetSuccess ? (
        <p className="border-success/30 bg-success/10 text-success rounded-lg border px-3 py-2 text-xs">
          Contraseña actualizada. Ingresa con tu contraseña nueva.
        </p>
      ) : justRegistered ? (
        <p className="border-success/30 bg-success/10 text-success rounded-lg border px-3 py-2 text-xs">
          ¡Cuenta creada con éxito! Ingresa tus datos para continuar.
        </p>
      ) : null}

      <TextField
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="tu@email.com"
        icon={<Mail size={16} />}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />

      <PasswordField
        label="Contraseña"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        icon={<Lock size={16} />}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
      />

      <div className="flex justify-end">
        <Link
          href={ROUTES.forgotPassword}
          className="text-info text-xs transition-colors hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {formError ? (
        <p
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-xs"
        >
          {formError}
        </p>
      ) : null}

      <Button type="submit" isLoading={isSubmitting} className="mt-2">
        <span>Iniciar Sesión</span>
        <ArrowRight size={16} />
      </Button>
    </form>
  );
}
