"use client";

import { CheckCircle2, Mail, RefreshCw, TriangleAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import {
  confirmEmailRequest,
  requestEmailConfirmationRequest,
} from "@/services/auth/client";

const EMAIL_NOT_VERIFIED_MESSAGE =
  "Tu cuenta ya está registrada, pero debes confirmar tu correo electrónico antes de iniciar sesión.";

export function ConfirmEmailForm() {
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

  useEffect(() => {
    if (!token) return;

    let active = true;
    async function confirm() {
      const result = await confirmEmailRequest(token);
      if (!active) return;
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
      active = false;
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
        <a
          href={ROUTES.login}
          className="from-accent rounded-xl bg-gradient-to-br to-[#1a4050] px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(36,92,107,0.4)] transition-all hover:brightness-110"
        >
          Ir a iniciar sesión
        </a>
      </section>
    );
  }

  const title = status === "expired" ? "El enlace expiró" : "Revisa tu correo";
  const description =
    status === "expired"
      ? "Este enlace ya no es válido. Vuelve al inicio de sesión e intenta nuevamente para recibir otro correo."
      : fromLogin
        ? EMAIL_NOT_VERIFIED_MESSAGE
        : "Te enviamos un enlace para confirmar tu correo y activar tu cuenta.";

  return (
    <section>
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
      <p className="text-content-muted mb-2 text-sm leading-relaxed">
        {description}
      </p>
      {fromLogin && email ? (
        <p className="text-content mb-6 text-sm font-semibold">{email}</p>
      ) : (
        <p className="text-content-subtle mb-6 text-xs">
          Revisa también tu carpeta de spam.
        </p>
      )}

      {isConfirming ? (
        <div className="text-content-muted flex items-center justify-center gap-2 py-3 text-sm">
          <RefreshCw size={16} className="animate-spin" />
          Confirmando tu correo...
        </div>
      ) : (
        <div className="space-y-4">
          {formError ? (
            <p
              role="alert"
              className="border-danger/30 bg-danger/10 text-danger rounded-lg border px-3 py-2 text-xs"
            >
              {formError}
            </p>
          ) : null}

          {fromLogin && email ? (
            <Button
              type="button"
              isLoading={isResending}
              onClick={() => void resend()}
            >
              <RefreshCw size={16} />
              <span>Reenviar confirmación</span>
            </Button>
          ) : (
            <p className="text-content-subtle text-center text-xs">
              Intenta iniciar sesión nuevamente si perdiste tu enlace de
              confirmación.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
