"use client";

import {
  PUSH_ACCOUNT_HINT,
  PUSH_ACCOUNT_LABEL,
  PUSH_ACCOUNT_OFF_NOTE,
  PUSH_DISABLE_BROWSER_LABEL,
  PUSH_ENABLE_BROWSER_LABEL,
  PUSH_PERMISSION_DENIED,
  PUSH_SETTINGS_TITLE,
  PUSH_THIS_BROWSER_OFF,
  PUSH_THIS_BROWSER_ON,
  PUSH_THIS_BROWSER_TITLE,
  PUSH_UNSUPPORTED,
} from "@discordia/client-shared";

import { AlertCircle, Bell, BellOff } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/cn";

export function PushSettings() {
  const { user } = useAuth();
  const push = usePushNotifications(user ? String(user.id) : null);
  const isAccountOff = push.accountEnabled === false;

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h3 className="text-content font-display text-base font-bold">
          {PUSH_SETTINGS_TITLE}
        </h3>
      </div>

      {push.error ? (
        <div
          role="alert"
          className="border-danger/30 bg-danger/10 text-danger flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{push.error}</span>
        </div>
      ) : null}

      <div className="border-line bg-surface-input flex items-center gap-3 rounded-xl border px-4 py-3">
        {isAccountOff ? (
          <BellOff size={18} className="text-content-subtle shrink-0" />
        ) : (
          <Bell size={18} className="text-content-subtle shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-content text-sm font-medium">
            {PUSH_ACCOUNT_LABEL}
          </p>
          <p className="text-content-subtle text-xs">{PUSH_ACCOUNT_HINT}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={push.accountEnabled === true}
          aria-label={PUSH_ACCOUNT_LABEL}
          disabled={push.accountEnabled === null}
          onClick={() => void push.setAccountEnabled(!push.accountEnabled)}
          className={cn(
            "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            push.accountEnabled ? "bg-accent" : "bg-surface-hover",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
              push.accountEnabled && "translate-x-5",
            )}
          />
        </button>
      </div>

      <div className="border-line rounded-xl border px-4 py-4">
        <p className="text-content-subtle mb-2 text-xs font-semibold tracking-wider uppercase">
          {PUSH_THIS_BROWSER_TITLE}
        </p>

        {push.browserStatus === "unsupported" ? (
          <p className="text-content-muted text-sm">{PUSH_UNSUPPORTED}</p>
        ) : push.browserStatus === "denied" ? (
          <p className="text-content-muted text-sm">{PUSH_PERMISSION_DENIED}</p>
        ) : (
          <>
            <p className="text-content-muted mb-3 text-sm">
              {push.browserStatus === "on"
                ? PUSH_THIS_BROWSER_ON
                : PUSH_THIS_BROWSER_OFF}
            </p>
            <button
              type="button"
              disabled={push.isBusy || push.browserStatus === "loading"}
              onClick={() =>
                void (push.browserStatus === "on"
                  ? push.disableBrowser()
                  : push.enableBrowser())
              }
              className="bg-accent text-on-accent hover:bg-accent-strong cursor-pointer rounded-md px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {push.browserStatus === "on"
                ? PUSH_DISABLE_BROWSER_LABEL
                : PUSH_ENABLE_BROWSER_LABEL}
            </button>
            {isAccountOff && push.browserStatus === "on" ? (
              <p className="text-content-subtle mt-3 text-xs">
                {PUSH_ACCOUNT_OFF_NOTE}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
