"use client";

import {
  ACCOUNT_SUSPENDED_ACTION,
  ACCOUNT_SUSPENDED_DESCRIPTION,
  ACCOUNT_SUSPENDED_TITLE,
} from "@discordia/client-shared";
import { Ban } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

export function AccountSuspendedModal() {
  const { isAccountSuspended, logout, isLoggingOut } = useAuth();

  if (!isAccountSuspended) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="account-suspended-title"
      aria-describedby="account-suspended-description"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm sm:p-6"
    >
      <div
        className="border-line-strong relative flex w-full flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{ maxWidth: 380, background: "var(--bg-modal)" }}
      >
        <div className="flex flex-col items-center gap-5 px-7 py-8 text-center">
          <div className="bg-danger/15 text-danger flex size-16 shrink-0 items-center justify-center rounded-2xl">
            <Ban size={30} />
          </div>

          <div>
            <h2
              id="account-suspended-title"
              className="font-display text-content mb-2 text-xl font-bold"
            >
              {ACCOUNT_SUSPENDED_TITLE}
            </h2>
            <p
              id="account-suspended-description"
              className="text-content-muted text-sm leading-relaxed"
            >
              {ACCOUNT_SUSPENDED_DESCRIPTION}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            autoFocus
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#c0392b] to-[#922b21] py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(192,57,43,0.4)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
          >
            {isLoggingOut ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              ACCOUNT_SUSPENDED_ACTION
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
