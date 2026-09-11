"use client";

import { AlertCircle, LogOut, Shield, X } from "lucide-react";
import { useState } from "react";

import { leaveServerRequest } from "@/features/servers/client";

interface LeaveServerModalProps {
  serverId: string;
  serverName: string;
  isOwner: boolean;
  onClose: () => void;
  onLeft: () => void;
}

/**
 * Solo self-leave (ver `features/servers/service.ts`): el owner no puede
 * abandonar su propio servidor, el backend lo rechaza con 409. Si lo sabemos
 * de antemano (`isOwner`) saltamos directo a ese estado, como en el Figma.
 */
export function LeaveServerModal({
  serverId,
  serverName,
  isOwner,
  onClose,
  onLeft,
}: LeaveServerModalProps) {
  const [isOwnerBlocked, setIsOwnerBlocked] = useState(isOwner);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLeave() {
    setIsLoading(true);
    setErrorMessage("");
    const result = await leaveServerRequest(serverId);
    setIsLoading(false);

    if (!result.ok) {
      if (result.isOwnerBlocked) setIsOwnerBlocked(true);
      else setErrorMessage(result.message);
      return;
    }

    onLeft();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        className="border-line-strong relative flex w-full flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{ maxWidth: 420, background: "var(--bg-modal)" }}
      >
        {!isLoading ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="bg-surface-input text-content-subtle border-line absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full border transition-transform hover:scale-110"
          >
            <X size={13} />
          </button>
        ) : null}

        <div className="flex flex-col items-center gap-5 px-7 py-8 text-center">
          {errorMessage ? (
            <div className="border-danger/30 bg-danger/10 text-danger -mb-1 flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div
            className={
              isOwnerBlocked
                ? "bg-info/15 text-info flex size-16 shrink-0 items-center justify-center rounded-2xl"
                : "bg-danger/15 text-danger flex size-16 shrink-0 items-center justify-center rounded-2xl"
            }
          >
            {isOwnerBlocked ? <Shield size={30} /> : <LogOut size={30} />}
          </div>

          {isOwnerBlocked ? (
            <>
              <div>
                <h2 className="font-display text-content mb-2 text-xl font-bold">
                  No podés abandonar tu servidor
                </h2>
                <p className="text-content-muted text-sm leading-relaxed">
                  Sos el propietario de{" "}
                  <strong className="text-content">{serverName}</strong>. Para
                  salir, primero tenés que transferir la propiedad a otro
                  miembro del servidor.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="bg-surface-input border-line text-content-muted w-full rounded-xl border py-3 text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Entendido
              </button>
            </>
          ) : (
            <>
              <div>
                <h2 className="font-display text-content mb-2 text-xl font-bold">
                  ¿Abandonar {serverName}?
                </h2>
                <p className="text-content-muted text-sm leading-relaxed">
                  Vas a perder acceso a todos sus canales de texto y voz. Para
                  volver a entrar vas a necesitar una nueva invitación.
                </p>
              </div>

              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="bg-surface-input border-line text-content-muted flex-1 rounded-xl border py-3 text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#c0392b] to-[#922b21] py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(192,57,43,0.4)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>Saliendo...</span>
                    </>
                  ) : (
                    "Abandonar servidor"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
