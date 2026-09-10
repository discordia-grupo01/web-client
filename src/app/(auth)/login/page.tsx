import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { AuthModeToggle } from "@/components/auth/auth-mode-toggle";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Iniciar sesion",
};

export default function LoginPage() {
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
        Bienvenido de nuevo!
      </h1>
      <p className="text-content-muted mb-7 text-sm">
        Ingresa tus credenciales para acceder.
      </p>

      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>

      <div className="my-5 flex items-center gap-3">
        <span className="bg-line h-px flex-1" />
        <span className="text-content-subtle text-xs font-medium">
          o continua con
        </span>
        <span className="bg-line h-px flex-1" />
      </div>

      <GoogleButton />

      <p className="text-content-subtle mt-6 text-center text-sm">
        No tenes cuenta?{" "}
        <Link
          href={ROUTES.register}
          className="text-sky font-medium hover:underline"
        >
          Registrate gratis
        </Link>
      </p>
    </>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="bg-surface-input h-[68px] rounded-xl" />
      <div className="bg-surface-input h-[68px] rounded-xl" />
      <div className="bg-surface-input h-11 rounded-xl" />
    </div>
  );
}
