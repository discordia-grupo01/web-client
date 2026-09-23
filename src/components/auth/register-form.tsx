"use client";

import {
  hasErrors,
  type RegisterErrors,
  validateRegister,
} from "@discordia/client-shared";

import { ArrowRight, AtSign, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { registerRequest } from "@/services/auth/client";
import { ROUTES } from "@/lib/constants";

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validateRegister({ name, email, password });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setIsSubmitting(true);
    const result = await registerRequest({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    router.replace(`${ROUTES.confirmEmail}?sent=1`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <TextField
        label="Nombre de usuario"
        name="name"
        type="text"
        autoComplete="username"
        placeholder="tucoolusername"
        icon={<AtSign size={16} />}
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name}
      />

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
        autoComplete="new-password"
        placeholder="••••••••"
        icon={<Lock size={16} />}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
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
        <span>Crear Cuenta</span>
        <ArrowRight size={16} />
      </Button>
    </form>
  );
}
