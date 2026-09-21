"use client";

import { GOOGLE_CONNECT_FAILED } from "@discordia/client-shared";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useEffect, useRef, useState } from "react";

import { GoogleIcon } from "@/components/icons/google-icon";
import { oauthGoogleLoginRequest } from "@/services/auth/client";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants";

const CLIENT_SIDE_ERROR_MESSAGE = GOOGLE_CONNECT_FAILED;

// Tamano con el que Google renderiza el boton (`size="large"`, ancho maximo
// permitido 400px). Se escala via CSS para cubrir el boton visual.
const GOOGLE_BUTTON_WIDTH = 400;
const GOOGLE_BUTTON_HEIGHT = 40;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale({
        x: width / GOOGLE_BUTTON_WIDTH,
        y: height / GOOGLE_BUTTON_HEIGHT,
      });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
        ref={containerRef}
        className={cn(
          "group relative h-11 w-full",
          isSubmitting && "pointer-events-none opacity-60",
        )}
        aria-busy={isSubmitting}
      >
        {/* Boton visual, con los estilos del design system. No recibe
            eventos: el click lo toma el iframe de Google que esta encima. */}
        <div
          aria-hidden="true"
          className={cn(
            "font-display flex h-full w-full items-center justify-center gap-2.5 rounded-xl border px-4 text-sm font-semibold transition-all",
            "bg-surface-input border-line text-content",
            "group-hover:border-line-strong group-hover:bg-surface-hover",
            "group-focus-within:ring-accent group-focus-within:ring-offset-surface-sunken group-focus-within:ring-2 group-focus-within:ring-offset-2",
            "group-active:scale-[0.98]",
          )}
        >
          {isSubmitting ? (
            <span className="border-content/30 border-t-content size-5 animate-spin rounded-full border-2" />
          ) : (
            <>
              <GoogleIcon size={18} />
              <span>Continuar con Google</span>
            </>
          )}
        </div>

        {/* El iframe de `<GoogleLogin>` no se puede estilar, asi que lo
            dejamos invisible y lo escalamos para que cubra todo el boton. */}
        <div
          className="absolute top-0 left-0 origin-top-left overflow-hidden opacity-0"
          style={{
            width: GOOGLE_BUTTON_WIDTH,
            height: GOOGLE_BUTTON_HEIGHT,
            transform: `scale(${scale.x}, ${scale.y})`,
          }}
        >
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            theme="outline"
            size="large"
            shape="rectangular"
            text="continue_with"
            width={String(GOOGLE_BUTTON_WIDTH)}
          />
        </div>
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
