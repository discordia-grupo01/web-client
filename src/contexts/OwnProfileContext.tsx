"use client";

import { type User } from "@discordia/client-shared";

import { createContext, useContext } from "react";

export interface OwnProfileContextValue {
  profile: User | null;
  refresh: () => Promise<void>;
}

const OwnProfileContext = createContext<OwnProfileContextValue | null>(null);

export const OwnProfileProvider = OwnProfileContext.Provider;

export function useOptionalOwnProfile(): OwnProfileContextValue | null {
  return useContext(OwnProfileContext);
}

export function useOwnPremium(): boolean {
  return useOptionalOwnProfile()?.profile?.premium ?? false;
}
