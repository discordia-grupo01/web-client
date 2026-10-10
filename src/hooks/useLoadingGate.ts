import { LOADING_SCREEN } from "@discordia/client-shared";

import { useEffect, useState } from "react";

type Phase = "waiting" | "loading" | "leaving" | "done";

const { showDelayMs, minVisibleMs, fadeOutMs } = LOADING_SCREEN;

export function useLoadingGate(
  isReady: boolean,
  { showImmediately = false } = {},
): Phase {
  const [delayElapsed, setDelayElapsed] = useState(showImmediately);
  const [minElapsed, setMinElapsed] = useState(false);
  const [faded, setFaded] = useState(false);
  const [wasReady, setWasReady] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  if (isReady && !wasReady) setWasReady(true);
  const ready = isReady || wasReady;

  useEffect(() => {
    if (showImmediately) return;
    const timer = setTimeout(() => setDelayElapsed(true), showDelayMs);
    return () => clearTimeout(timer);
  }, [showImmediately]);

  useEffect(() => {
    if (!delayElapsed) return;
    const timer = setTimeout(() => setMinElapsed(true), minVisibleMs);
    return () => clearTimeout(timer);
  }, [delayElapsed]);

  const isLeaving = delayElapsed && minElapsed && ready;
  useEffect(() => {
    if (!isLeaving) return;
    const timer = setTimeout(() => setFaded(true), fadeOutMs);
    return () => clearTimeout(timer);
  }, [isLeaving]);

  let phase: Phase;
  if (!delayElapsed) phase = ready ? "done" : "waiting";
  else if (faded) phase = "done";
  else phase = isLeaving ? "leaving" : "loading";

  if (phase === "done" && !isFinished) setIsFinished(true);
  return isFinished ? "done" : phase;
}
