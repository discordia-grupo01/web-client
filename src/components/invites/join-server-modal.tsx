"use client";

import { AlertCircle, ArrowRight, Check, Link2, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { ServerAvatar } from "@/components/ui/server-avatar";
import {
  joinServerRequest,
  normalizeInviteCode,
} from "@/services/invites/client";
import type { ServerSummary } from "@/services/servers/types";

interface JoinServerModalProps {
  onClose: () => void;
  onJoined: (server: ServerSummary) => void;
}

export function JoinServerModal({ onClose, onJoined }: JoinServerModalProps) {
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joined, setJoined] = useState<{
    server: ServerSummary;
    alreadyMember: boolean;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError("");
    setGlobalError("");

    const trimmed = code.trim();
    if (!trimmed) {
      setFieldError("Pegá un enlace o código de invitación.");
      return;
    }

    setIsSubmitting(true);
    const result = await joinServerRequest(normalizeInviteCode(trimmed));
    setIsSubmitting(false);

    if (!result.ok) {
      if (result.fieldErrors?.code) setFieldError(result.fieldErrors.code);
      else setGlobalError(result.message);
      return;
    }

    setJoined({ server: result.server, alreadyMember: result.alreadyMember });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="border-line-strong relative flex w-full flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{
          maxWidth: 440,
          maxHeight: "95dvh",
          background: "var(--bg-modal)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="bg-surface-input text-content-subtle border-line absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full border transition-transform hover:scale-110"
        >
          <X size={13} />
        </button>

        <div className="flex-1 overflow-y-auto">
          {joined ? (
            <div className="flex flex-col items-center gap-6 px-6 py-8 text-center">
              <ServerAvatar
                name={joined.server.name}
                src={`/api/servers/${joined.server.id}/icon`}
                size={64}
                className="rounded-2xl"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="bg-success/15 text-success flex size-12 items-center justify-center rounded-2xl">
                  <Check size={26} />
                </div>
                <p className="font-display text-content text-base font-bold">
                  {joined.alreadyMember
                    ? "Ya sos miembro"
                    : "¡Listo, te uniste!"}
                </p>
                <p className="text-content-muted max-w-[260px] text-sm leading-relaxed">
                  <strong className="text-content">{joined.server.name}</strong>
                  {joined.alreadyMember
                    ? " ya te tenía como miembro."
                    : " te está esperando en la barra lateral."}
                </p>
              </div>
              <Button type="button" onClick={() => onJoined(joined.server)}>
                Ir al servidor
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="px-7 pt-8 pb-2">
                <div className="mb-1 flex items-center gap-3">
                  <div className="bg-info/15 text-info flex size-9 shrink-0 items-center justify-center rounded-xl">
                    <Link2 size={17} />
                  </div>
                  <div>
                    <h2 className="font-display text-content text-lg font-bold">
                      Unirme con enlace
                    </h2>
                    <p className="text-content-subtle text-xs">
                      Pegá el enlace o código de invitación
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-7 py-6">
                {globalError ? (
                  <div className="border-danger/30 bg-danger/10 text-danger flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
                    <AlertCircle size={16} />
                    <span>{globalError}</span>
                  </div>
                ) : null}

                <div>
                  <label
                    htmlFor="invite-code"
                    className="text-content-subtle mb-1.5 block text-xs font-bold tracking-wider uppercase"
                  >
                    Enlace o código de invitación
                  </label>
                  <div
                    className={`bg-surface-input flex items-center gap-2 rounded-xl border px-4 py-3 transition-colors ${
                      fieldError ? "border-danger" : "border-line"
                    }`}
                  >
                    <Link2 size={15} className="text-content-subtle shrink-0" />
                    <input
                      ref={inputRef}
                      id="invite-code"
                      type="text"
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value);
                        setFieldError("");
                        setGlobalError("");
                      }}
                      placeholder="ej: /invite/xY7z2Q"
                      autoFocus
                      className="text-content min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
                    />
                  </div>
                  {fieldError ? (
                    <div className="text-danger mt-1.5 flex items-center gap-1.5 text-xs">
                      <AlertCircle size={13} />
                      <span>{fieldError}</span>
                    </div>
                  ) : null}
                </div>

                <p className="text-content-subtle text-xs">
                  Los enlaces de invitación tienen este formato:{" "}
                  <span className="text-content-muted font-mono">
                    /invite/xY7z2Q
                  </span>
                </p>
              </div>

              <div className="border-line flex items-center justify-end gap-3 border-t px-7 py-5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!code.trim()}
                  isLoading={isSubmitting}
                  className="w-auto"
                >
                  <span>Unirme</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
