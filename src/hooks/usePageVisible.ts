"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const isVisible = () => document.visibilityState === "visible";
const isVisibleOnServer = () => true;

export function usePageVisible(): boolean {
  return useSyncExternalStore(subscribe, isVisible, isVisibleOnServer);
}
