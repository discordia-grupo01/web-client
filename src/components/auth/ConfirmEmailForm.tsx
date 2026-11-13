"use client";

import { CHECK_SPAM_HINT, EMAIL_NOT_VERIFIED } from "@discordia/client-shared";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/constants";
import {
  confirmEmailRequest,
  requestEmailConfirmationRequest,
} from "@/services/auth/client";

export function ConfirmEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const fromLogin = searchParams.get("from") === "login";
  const sent = searchParams.get("sent") === "1";
  const email = fromLogin ? (searchParams.get("email") ?? "") : "";
  const [formError, setFormError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(Boolean(token));
  const [isResending, setIsResending] = useState(false);
  const [status, setStatus] = useState<"sent" | "confirmed" | "expired" | null>(
    sent ? "sent" : null,
  );
  const confirmationRequestToken = useRef<string | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!token) return;
    isMounted.current = true;
    if (confirmationRequestToken.current === token) return;
    confirmationRequestToken.current = token;

    async function confirm() {
      const result = await confirmEmailRequest(token);
      if (!isMounted.current || confirmationRequestToken.current !== token) {
        return;
      }
      setIsConfirming(false);
      if (result.ok) {
        setStatus("confirmed");
        return;
      }
      setStatus("expired");
      setFormError(
        result.message ?? "El enlace de confirmación no es válido o expiró.",
      );
    }

    void confirm();
    return () => {
      isMounted.current = false;
    };
  }, [token]);

  async function resend() {
    setFormError(null);
    setIsResending(true);
    const result = await requestEmailConfirmationRequest(email.trim());
    setIsResending(false);
    if (!result.ok) {
      setFormError(result.message ?? "No pudimos enviar el correo.");
      return;
    }
    setStatus("sent");
  }

  if (status === "confirmed") {
    return (
      <section className="flex flex-col items-center text-center">
        <div className="bg-success/15 text-success mb-5 flex size-16 items-center justify-center rounded-2xl">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="font-display text-content mb-2 text-2xl font-bold">
          Correo confirmado
        </h1>
        <p className="text-content-muted mb-8 text-sm leading-relaxed">
          Tu cuenta está lista. Ya puedes iniciar sesión en Discordia.
        </p>
        <Button type="button" onClick={() => router.push(ROUTES.login)}>
          <span>Ir a iniciar sesión</span>
          <ArrowRight size={16} />
        </Button>
      </section>
    );
  }

  const title = status === "expired" ? "El enlace expiró" : "Revisa tu correo";
  const description =
    status === "expired"
      ? "Este enlace ya no es válido. Vuelve al inicio de sesión e intenta nuevamente para recibir otro correo."
      : fromLogin
        ? EMAIL_NOT_VERIFIED
        : "Te enviamos un enlace para confirmar tu correo y activar tu cuenta.";

  return (
    <section className="flex flex-col items-center text-center">
      <div className="bg-accent/15 text-accent mb-5 flex size-16 items-center justify-center rounded-2xl">
        {status === "expired" ? (
          <TriangleAlert size={32} />
        ) : (
          <Mail size={32} />
        )}
      </div>
      <h1 className="font-display text-content mb-2 text-2xl font-bold">
        {title}
      </h1>
      <div className="mb-8 space-y-2">
        <p className="text-content-muted text-sm leading-relaxed">
          {description}
        </p>
        {fromLogin && email ? (
          <p className="text-content text-sm font-semibold">{email}</p>
        ) : null}
        {status === "expired" ? null : (
          <p className="text-content-subtle text-xs">{CHECK_SPAM_HINT}</p>
        )}
      </div>

      {isConfirming ? (
        <div className="text-content-muted flex items-center justify-center gap-2 py-3 text-sm">
          <RefreshCw size={16} className="animate-spin" />
          Confirmando tu correo...
        </div>
      ) : (
        <div className="w-full space-y-3">
          {formError ? (
            <p
              role="alert"
              className="border-danger/30 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-xs"
            >
              {formError}
            </p>
          ) : null}

          {fromLogin && email ? (
            <>
              <Button
                type="button"
                isLoading={isResending}
                onClick={() => void resend()}
              >
                <RefreshCw size={16} />
                <span>Reenviar confirmación</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(ROUTES.login)}
              >
                Volver al inicio de sesión
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => router.push(ROUTES.login)}>
              <span>Volver al inicio de sesión</span>
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
