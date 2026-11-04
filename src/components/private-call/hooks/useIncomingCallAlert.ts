"use client";

import { useEffect } from "react";

const RING_EVERY_MS = 2_000;
const TONE_SECONDS = 0.4;
const TONES_HZ = [480, 620];
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
  if (typeof AudioContext === "undefined") return null;
  const context = new AudioContext();
  void context.resume().catch(() => undefined);

  const ring = () => {
    if (context.state !== "running") return;
    TONES_HZ.forEach((frequency, index) => {
      const startsAt = context.currentTime + index * TONE_SECONDS;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.08, startsAt);
      gain.gain.exponentialRampToValueAtTime(0.001, startsAt + TONE_SECONDS);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + TONE_SECONDS);
    });
  };

  ring();
  const interval = window.setInterval(ring, RING_EVERY_MS);
  return {
    stop: () => {
      window.clearInterval(interval);
      void context.close().catch(() => undefined);
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
