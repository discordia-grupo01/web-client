"use client";

import {
  PUSH_ACCOUNT_HINT,
  PUSH_ACCOUNT_LABEL,
  PUSH_ACCOUNT_OFF_NOTE,
  PUSH_DISABLE_BROWSER_LABEL,
  PUSH_ENABLE_BROWSER_LABEL,
  PUSH_PERMISSION_DENIED,
  PUSH_THIS_BROWSER_OFF,
  PUSH_THIS_BROWSER_ON,
  PUSH_THIS_BROWSER_TITLE,
  PUSH_UNSUPPORTED,
} from "@discordia/client-shared";

import { AlertCircle, Bell, BellOff } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/Button";
import { SettingsCard } from "@/components/ui/settings/SettingsCard";
import { SettingsGroup } from "@/components/ui/settings/SettingsGroup";
import { SettingsRow } from "@/components/ui/settings/SettingsRow";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";
import { Switch } from "@/components/ui/Switch";

export function PushSettings() {
  const { user } = useAuth();
  const push = usePushNotifications(user ? String(user.id) : null);
  const isAccountOff = push.accountEnabled === false;

  return (
    <SettingsSection>
      <div className="flex flex-col gap-6">
        {push.error ? (
          <div
            role="alert"
            className="border-danger/30 bg-danger/10 text-danger flex items-start gap-3 rounded-xl border px-4 py-3 text-sm"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{push.error}</span>
          </div>
        ) : null}

        <SettingsCard>
          <SettingsRow
            label={
              <span className="flex items-center gap-2">
                {isAccountOff ? (
                  <BellOff size={16} className="text-content-subtle shrink-0" />
                ) : (
                  <Bell size={16} className="text-content-subtle shrink-0" />
                )}
                {PUSH_ACCOUNT_LABEL}
              </span>
            }
            hint={PUSH_ACCOUNT_HINT}
            control={
              <Switch
                checked={push.accountEnabled === true}
                label={PUSH_ACCOUNT_LABEL}
                disabled={push.accountEnabled === null}
                onChange={(next) => void push.setAccountEnabled(next)}
              />
            }
          />
        </SettingsCard>

        <SettingsGroup label={PUSH_THIS_BROWSER_TITLE}>
          <SettingsCard className="py-4">
            {push.browserStatus === "unsupported" ? (
              <p className="text-content-muted text-sm">{PUSH_UNSUPPORTED}</p>
            ) : push.browserStatus === "denied" ? (
              <p className="text-content-muted text-sm">
                {PUSH_PERMISSION_DENIED}
              </p>
            ) : (
              <>
                <p className="text-content-muted mb-3 text-sm">
                  {push.browserStatus === "on"
                    ? PUSH_THIS_BROWSER_ON
                    : PUSH_THIS_BROWSER_OFF}
                </p>
                <Button
                  type="button"
                  className="w-auto px-4 py-2"
                  disabled={push.isBusy || push.browserStatus === "loading"}
                  onClick={() =>
                    void (push.browserStatus === "on"
                      ? push.disableBrowser()
                      : push.enableBrowser())
                  }
                >
                  {push.browserStatus === "on"
                    ? PUSH_DISABLE_BROWSER_LABEL
                    : PUSH_ENABLE_BROWSER_LABEL}
                </Button>
                {isAccountOff && push.browserStatus === "on" ? (
                  <p className="text-content-subtle mt-3 text-xs">
                    {PUSH_ACCOUNT_OFF_NOTE}
                  </p>
                ) : null}
              </>
            )}
          </SettingsCard>
        </SettingsGroup>
      </div>
    </SettingsSection>
  );
}
