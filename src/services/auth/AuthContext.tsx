"use client";

import { type User } from "@discordia/client-shared";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import { ROUTES } from "@/lib/constants";

import { logoutRequest } from "./client";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Expone el usuario de la sesion (resuelto en el servidor) y el logout.
 * El `initialUser` viene del RootLayout, que lo lee de la cookie httpOnly.
 */
export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: User | null;
  children: ReactNode;
}) {
  const [user] = useState(initialUser);
  const [isLoggingOut, startLogout] = useTransition();

  const logout = useCallback(() => {
    startLogout(async () => {
      await logoutRequest();
      window.location.href = ROUTES.login;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoggingOut,
      logout,
    }),
    [user, isLoggingOut, logout],
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
