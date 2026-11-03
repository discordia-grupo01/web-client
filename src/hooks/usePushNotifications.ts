"use client";

import {
  PUSH_SETTINGS_SAVE_FAILED,
  PUSH_UNREGISTER_FAILED,
} from "@discordia/client-shared";

import { useCallback, useEffect, useState } from "react";

import {
  getThisBrowserSubscription,
  isPushWanted,
  isWebPushSupported,
  markPushWanted,
  readPushDeviceId,
  registerThisBrowser,
  unregisterThisBrowser,
} from "@/services/push/browser";
import {
  getPushSettingsRequest,
  updatePushSettingsRequest,
} from "@/services/push/client";

export type PushBrowserStatus =
  "loading" | "unsupported" | "denied" | "off" | "on";

export function usePushDeviceSync(userId: string | null) {
  useEffect(() => {
    if (!userId || !isWebPushSupported()) return;
    if (Notification.permission !== "granted") return;
    if (!isPushWanted(userId) || readPushDeviceId(userId)) return;
    void registerThisBrowser(userId);
  }, [userId]);
}

async function readBrowserStatus(
  userId: string | null,
): Promise<PushBrowserStatus> {
  if (!isWebPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (!userId) return "off";
  const subscription = await getThisBrowserSubscription();
  return subscription && readPushDeviceId(userId) ? "on" : "off";
}

export function usePushNotifications(userId: string | null) {
  const [accountEnabled, setAccountEnabledState] = useState<boolean | null>(
    null,
  );
  const [browserStatus, setBrowserStatus] =
    useState<PushBrowserStatus>("loading");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void getPushSettingsRequest().then((result) => {
      if (isCancelled) return;
      if (result.ok) setAccountEnabledState(result.enabled);
      else setError(result.message);
    });
    void readBrowserStatus(userId).then((status) => {
      if (!isCancelled) setBrowserStatus(status);
    });

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const setAccountEnabled = useCallback(
    async (enabled: boolean) => {
      const previous = accountEnabled;
      setError(null);
      setAccountEnabledState(enabled);
      const result = await updatePushSettingsRequest(enabled);
      if (result.ok) {
        setAccountEnabledState(result.enabled);
        return;
      }
      setAccountEnabledState(previous);
      setError(result.message || PUSH_SETTINGS_SAVE_FAILED);
    },
    [accountEnabled],
  );

  const enableBrowser = useCallback(async () => {
    if (!userId || !isWebPushSupported()) return;
    setIsBusy(true);
    setError(null);

    const permission =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;

    if (permission !== "granted") {
      setBrowserStatus(permission === "denied" ? "denied" : "off");
      setIsBusy(false);
      return;
    }

    const result = await registerThisBrowser(userId);
    if (result.ok) {
      markPushWanted(userId, true);
      setBrowserStatus("on");
    } else {
      setError(result.message);
    }
    setIsBusy(false);
  }, [userId]);

  const disableBrowser = useCallback(async () => {
    if (!userId) return;
    setIsBusy(true);
    setError(null);

    const removed = await unregisterThisBrowser(userId);
    if (removed) {
      markPushWanted(userId, false);
      setBrowserStatus("off");
    } else {
      setError(PUSH_UNREGISTER_FAILED);
    }
    setIsBusy(false);
  }, [userId]);

  return {
    accountEnabled,
    browserStatus,
    isBusy,
    error,
    setAccountEnabled,
    enableBrowser,
    disableBrowser,
  };
}
