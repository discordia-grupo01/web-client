"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useState } from "react";

import { oauthGoogleLoginRequest } from "@/services/auth/client";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants";

const CLIENT_SIDE_ERROR_MESSAGE =
  "No pudimos conectar con Google. Iniciá sesión con tu correo y contraseña.";

/**
 * Login federado con Google (CA1: cuenta nueva, CA2: cuenta existente por
 * email, ambos resueltos por el backend en `POST /v1/oauth/google`).
 *
 * Usamos el componente `<GoogleLogin>` (no el hook `useGoogleLogin`, que por
 * defecto entrega un access token) porque es el unico que expone un ID token
 * JWT via `onSuccess` (`credentialResponse.credential`), que es lo que el
 * backend espera como `id_token`.
 */
export function GoogleButton() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSuccess(credentialResponse: CredentialResponse) {
    setError(null);

    const idToken = credentialResponse.credential;
    if (!idToken) {
      setError(CLIENT_SIDE_ERROR_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    const result = await oauthGoogleLoginRequest(idToken);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    window.location.href = ROUTES.home;
  }

  function handleError() {
    // El SDK de Google no cargo, fue bloqueado, o hubo un error de red del
    // lado del navegador (CA3, version cliente). El formulario de email y
    // contrasena sigue visible al lado, sin necesidad de tocar nada mas.
    setError(CLIENT_SIDE_ERROR_MESSAGE);
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "flex justify-center",
          isSubmitting && "pointer-events-none opacity-60",
        )}
        aria-busy={isSubmitting}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          theme="outline"
          shape="rectangular"
          text="continue_with"
          width="336"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-xs"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
