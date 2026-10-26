import { ACCOUNT_SUSPENDED_COOKIE } from "@/lib/constants";

type Listener = () => void;

const listeners = new Set<Listener>();

export function hasAccountSuspendedMark(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((entry) => entry.trim().startsWith(`${ACCOUNT_SUSPENDED_COOKIE}=`));
}

export function onAccountSuspended(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function checkAccountSuspended(): void {
  if (!hasAccountSuspendedMark()) return;
  listeners.forEach((listener) => listener());
}
