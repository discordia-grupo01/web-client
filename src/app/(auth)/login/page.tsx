import { Zap } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Iniciar sesion",
};

export default function LoginPage() {
  return (
    <>
      {/* Logo (solo mobile; en desktop lo muestra AuthBrandingPanel) */}
      <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
        <div
          className="flex size-10 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg, #245C6B, #1C293B)" }}
        >
          <Zap size={18} className="text-white" fill="currentColor" />
        </div>
        <span className="font-display text-content text-xl font-bold">
          {APP_NAME}
        </span>
      </div>

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
        <button
          type="button"
          title="Disponible proximamente"
          className="text-sky/70 cursor-not-allowed font-medium"
        >
          Registrate gratis
        </button>
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
