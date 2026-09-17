"use client";

import { LogOut, X } from "lucide-react";

import { useAuth } from "@/services/auth/auth-context";

interface LogoutConfirmModalProps {
  onClose: () => void;
}

export function LogoutConfirmModal({ onClose }: LogoutConfirmModalProps) {
  const { logout, isLoggingOut } = useAuth();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isLoggingOut) onClose();
      }}
    >
      <div
        className="border-line-strong relative flex w-full flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{ maxWidth: 380, background: "var(--bg-modal)" }}
      >
        {!isLoggingOut ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="bg-surface-input text-content-subtle border-line absolute top-4 right-4 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-110"
          >
            <X size={13} />
          </button>
        ) : null}

        <div className="flex flex-col items-center gap-5 px-7 py-8 text-center">
          <div className="bg-danger/15 text-danger flex size-16 shrink-0 items-center justify-center rounded-2xl">
            <LogOut size={30} />
          </div>

          <div>
            <h2 className="font-display text-content mb-2 text-xl font-bold">
              ¿Cerrar sesión?
            </h2>
            <p className="text-content-muted text-sm leading-relaxed">
              Vas a salir de tu cuenta. Podés volver a iniciar sesión cuando
              quieras.
            </p>
          </div>

          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoggingOut}
              className="bg-surface-input border-line text-content-muted flex-1 cursor-pointer rounded-xl border py-3 text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={logout}
              disabled={isLoggingOut}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#c0392b] to-[#922b21] py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(192,57,43,0.4)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
            >
              {isLoggingOut ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Cerrando...</span>
                </>
              ) : (
                "Cerrar sesión"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
