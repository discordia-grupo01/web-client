"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { forgotPasswordRequest } from "@/features/auth/client";
import {
  hasErrors,
  validateForgotPassword,
  type ForgotPasswordErrors,
} from "@/features/auth/validation";
import { ROUTES } from "@/lib/constants";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateForgotPassword({ email });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    const result = await forgotPasswordRequest({ email: email.trim() });
    setIsSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="bg-success/15 text-success mb-5 flex size-16 items-center justify-center rounded-2xl">
          <CheckCircle2 size={32} />
        </div>

        <h1 className="font-display text-content mb-2 text-2xl font-bold">
          Revisa tu correo
        </h1>
        <p className="text-content-muted mb-2 text-sm leading-relaxed">
          Si <strong className="text-content">{email.trim()}</strong> esta
          registrado en Discordia, recibiras un enlace para restablecer tu
          contraseña en los proximos minutos.
        </p>
        <p className="text-content-subtle mb-8 text-xs">
          Recuerda revisar tu carpeta de spam por si acaso.
        </p>

        <Link
          href={ROUTES.login}
          className="text-content-subtle text-sm hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href={ROUTES.login}
        className="text-content-subtle mb-6 flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
      >
        <ArrowLeft size={14} />
        Volver al inicio de sesion
      </Link>

      <h1 className="font-display text-content mb-1 text-2xl font-bold">
        Recuperar contraseña
      </h1>
      <p className="text-content-muted mb-7 text-sm">
        Ingresa tu correo y te enviaremos un enlace para restablecer tu
        contraseña.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField
          label="Correo electronico"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          icon={<Mail size={16} />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
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
          <span>Enviar enlace</span>
          <ArrowRight size={16} />
        </Button>
      </form>
    </>
  );
}
