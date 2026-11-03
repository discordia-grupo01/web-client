import type { User } from "@discordia/client-shared";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
const logoutRequest = vi.fn(() => {
  calls.push("logout");
  return Promise.resolve();
});
const unregisterOnLogout = vi.fn((_userId: string) => {
  calls.push("push");
  return Promise.resolve();
});
const clearPendingMessages = vi.fn();

vi.mock("@/services/auth/client", () => ({
  logoutRequest: () => logoutRequest(),
}));

vi.mock("@/services/push/browser", () => ({
  unregisterOnLogout: (userId: string) => unregisterOnLogout(userId),
}));

vi.mock("@/utils/pendingMessages", () => ({
  clearPendingMessages: (userId: string) => clearPendingMessages(userId),
}));

vi.mock("@/utils/accountSuspension", () => ({
  hasAccountSuspendedMark: () => false,
  onAccountSuspended: () => () => undefined,
}));

import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const user = { id: 7, name: "Ana" } as unknown as User;

function wrapper(initialUser: User | null) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider initialUser={initialUser}>{children}</AuthProvider>;
  };
}

describe("AuthProvider logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "/home" },
    });
  });

  it("quita el dispositivo de push antes de cerrar la sesion", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(user) });

    act(() => result.current.logout());

    await waitFor(() => expect(window.location.href).toBe("/login"));
    expect(unregisterOnLogout).toHaveBeenCalledWith("7");
    expect(calls).toEqual(["push", "logout"]);
    expect(clearPendingMessages).toHaveBeenCalledWith("7");
  });

  it("cierra la sesion aunque no haya usuario y no toca el push", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper(null) });

    act(() => result.current.logout());

    await waitFor(() => expect(logoutRequest).toHaveBeenCalled());
    expect(unregisterOnLogout).not.toHaveBeenCalled();
  });
});
