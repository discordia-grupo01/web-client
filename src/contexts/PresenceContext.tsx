"use client";

import {
  type ActivityStatusChoice,
  createPresenceStore,
  type MessageActionResult,
  OWN_STATUS_FAILED,
  type PresenceStore,
} from "@discordia/client-shared";
import { createContext, useContext } from "react";

export interface PresenceContextValue {
  store: PresenceStore;
  setOwnStatus: (choice: ActivityStatusChoice) => Promise<MessageActionResult>;
}

// Sin proveedor (fuera de la home, o en tests) todos se ven desconectados.
const FALLBACK: PresenceContextValue = {
  store: createPresenceStore(null),
  setOwnStatus: async () => ({ ok: false, message: OWN_STATUS_FAILED }),
};

const PresenceContext = createContext<PresenceContextValue>(FALLBACK);

/** Lo pone `HomeShell`, que es quien tiene la sala personal (`usePresenceSession`). */
export const PresenceProvider = PresenceContext.Provider;

export function usePresenceContext(): PresenceContextValue {
  return useContext(PresenceContext);
}
