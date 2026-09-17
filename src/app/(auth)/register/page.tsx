import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AuthModeToggle } from "@/components/auth/auth-mode-toggle";
import { GoogleButton } from "@/components/auth/google-button";
import { RegisterForm } from "@/components/auth/register-form";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function RegisterPage() {
  return (
    <>
      {/* Logo (solo mobile; en desktop lo muestra AuthBrandingPanel) */}
      <Image
        src="/logo-light.png"
        alt="discordia"
        width={1010}
        height={269}
        priority
        className="mb-8 h-auto w-48 lg:hidden"
      />

      <AuthModeToggle />

      <h1 className="font-display text-content mb-1 text-2xl font-bold">
        Crea tu cuenta
      </h1>
      <p className="text-content-muted mb-7 text-sm">
        Es gratis y siempre lo será.
      </p>

      <RegisterForm />

      <div className="my-5 flex items-center gap-3">
        <span className="bg-line h-px flex-1" />
        <span className="text-content-subtle text-xs font-medium">
          o continuá con
        </span>
        <span className="bg-line h-px flex-1" />
      </div>

      <GoogleButton />

      <p className="text-content-subtle mt-6 text-center text-sm">
        ¿Ya tenés cuenta?{" "}
        <Link
          href={ROUTES.login}
          className="text-sky font-medium hover:underline"
        >
          Inicia sesión
        </Link>
      </p>

      <p className="text-content-subtle mt-4 text-center text-[11px] leading-relaxed opacity-70">
        Al registrarte aceptas nuestros{" "}
        <span className="text-content-muted">Términos de Servicio</span> y{" "}
        <span className="text-content-muted">Política de Privacidad</span>.
      </p>
    </>
  );
}
