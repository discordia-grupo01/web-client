"use client";

import Link from "next/link";
import { Suspense, useState } from "react";

import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthModeToggle } from "@/components/auth/auth-mode-toggle";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { ROUTES } from "@/lib/constants";

type ActiveChallenge = "login" | "google" | null;

/**
 * Cuando cualquiera de los dos flujos (form o Google) entra en 2FA, esa
 * misma rama pasa a ocupar toda la pantalla (mismo look que login/register):
 * se ocultan los tabs, el titulo, el divisor y el otro metodo de login.
 */
export function LoginScreen() {
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge>(null);
  const challengeActive = activeChallenge !== null;

  return (
    <>
      <AuthLogo />

      {!challengeActive ? <AuthModeToggle /> : null}

      {!challengeActive ? (
        <>
          <h1 className="font-display text-content mb-1 text-2xl font-bold">
            ¡Bienvenido de nuevo!
          </h1>
          <p className="text-content-muted mb-7 text-sm">
            Ingresa tus credenciales para acceder.
          </p>
        </>
      ) : null}

      {activeChallenge !== "google" ? (
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm
            onTwoFactorChallengeChange={(active) =>
              setActiveChallenge(active ? "login" : null)
            }
          />
        </Suspense>
      ) : null}

      {!challengeActive ? (
        <div className="my-5 flex items-center gap-3">
          <span className="bg-line h-px flex-1" />
          <span className="text-content-subtle text-xs font-medium">
            o continuá con
          </span>
          <span className="bg-line h-px flex-1" />
        </div>
      ) : null}

      {activeChallenge !== "login" ? (
        <GoogleButton
          onTwoFactorChallengeChange={(active) =>
            setActiveChallenge(active ? "google" : null)
          }
        />
      ) : null}

      {!challengeActive ? (
        <p className="text-content-subtle mt-6 text-center text-sm">
          ¿No tenés cuenta?{" "}
          <Link
            href={ROUTES.register}
            className="text-sky font-medium hover:underline"
          >
            Registrate gratis
          </Link>
        </p>
      ) : null}
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
