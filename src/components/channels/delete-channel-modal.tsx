"use client";

import { AlertCircle, Trash2, X } from "lucide-react";
import { useState } from "react";

import { deleteChannelRequest } from "@/services/channels/client";
import type { Channel } from "@/services/channels/types";

interface DeleteChannelModalProps {
  channel: Channel;
  onClose: () => void;
  onDeleted: () => void;
}

/** CA2 de "Eliminar canal": requiere confirmacion explicita antes de borrar. */
export function DeleteChannelModal({
  channel,
  onClose,
  onDeleted,
}: DeleteChannelModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    setIsLoading(true);
    setErrorMessage("");
    const result = await deleteChannelRequest(channel.id);
    setIsLoading(false);

    if (!result.ok) {
      setErrorMessage(result.message);
      return;
    }

    onDeleted();
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

          <div className="bg-danger/15 text-danger flex size-16 shrink-0 items-center justify-center rounded-2xl">
            <Trash2 size={30} />
          </div>

          <div>
            <h2 className="font-display text-content mb-2 text-xl font-bold">
              ¿Eliminar #{channel.name}?
            </h2>
            <p className="text-content-muted text-sm leading-relaxed">
              Esta acción no se puede deshacer. Se va a eliminar el canal y su
              historial de mensajes de forma permanente.
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
              onClick={handleDelete}
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#c0392b] to-[#922b21] py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(192,57,43,0.4)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Eliminando...</span>
                </>
              ) : (
                "Eliminar canal"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
