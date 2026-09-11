"use client";

import { ArrowRight, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { loginRequest } from "@/features/auth/client";
import {
  hasErrors,
  validateLogin,
  type LoginErrors,
} from "@/features/auth/validation";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    router.replace(next && next.startsWith("/") ? next : ROUTES.home);
    router.refresh();
  }

  return (
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

      <PasswordField
        label="Contrasena"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        icon={<Lock size={16} />}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
      />

      <div className="flex justify-end">
        <button
          type="button"
          title="Disponible proximamente"
          className="text-info/70 cursor-not-allowed text-xs"
        >
          Olvidaste tu contrasena?
        </button>
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
        <span>Iniciar Sesion</span>
        <ArrowRight size={16} />
      </Button>
    </form>
  );
}
