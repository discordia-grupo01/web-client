"use client";

import { useEffect } from "react";

const RINGTONE_URL = "/sounds/llamada-entrante.mp3";
const TITLE_BLINK_MS = 1_000;

export function useIncomingCallAlert(isActive: boolean, title: string) {
  useEffect(() => {
    if (!isActive) return;
    const audio = startRinging();
    const restoreTitle = blinkTitle(title);
    return () => {
      audio?.stop();
      restoreTitle();
    };
  }, [isActive, title]);
}

function startRinging(): { stop: () => void } | null {
  if (typeof Audio === "undefined") return null;
  const audio = new Audio(RINGTONE_URL);
  audio.loop = true;
  // El navegador bloquea el audio si el usuario todavía no interactuó con la página.
  void Promise.resolve()
    .then(() => audio.play())
    .catch(() => undefined);
  return {
    stop: () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    },
  };
}

function blinkTitle(alert: string): () => void {
  const original = document.title;
  let isShowingAlert = false;
  const interval = window.setInterval(() => {
    isShowingAlert = !isShowingAlert;
    document.title = isShowingAlert ? alert : original;
  }, TITLE_BLINK_MS);
  return () => {
    window.clearInterval(interval);
    document.title = original;
  };
}
