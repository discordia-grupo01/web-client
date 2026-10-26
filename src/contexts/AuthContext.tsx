"use client";

import { type User } from "@discordia/client-shared";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { ROUTES } from "@/lib/constants";
import {
  hasAccountSuspendedMark,
  onAccountSuspended,
} from "@/utils/accountSuspension";
import { clearPendingMessages } from "@/utils/pendingMessages";

import { logoutRequest } from "@/services/auth/client";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  logout: () => void;
  isAccountSuspended: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: ReactNode;
}) {
  const [user] = useState(initialUser);
  const [isLoggingOut, startLogout] = useTransition();
  const [isAccountSuspended, setIsAccountSuspended] = useState(false);

  useEffect(() => {
    if (hasAccountSuspendedMark()) setIsAccountSuspended(true);
    return onAccountSuspended(() => setIsAccountSuspended(true));
  }, []);

  const userId = user?.id;
  const logout = useCallback(() => {
    startLogout(async () => {
      await logoutRequest();
      if (userId !== undefined) clearPendingMessages(String(userId));
      window.location.href = ROUTES.login;
    });
  }, [userId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoggingOut,
      logout,
      isAccountSuspended,
    }),
    [user, isLoggingOut, logout, isAccountSuspended],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return context;
}
