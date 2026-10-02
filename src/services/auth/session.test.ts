import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const cookieJar = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: () => cookieJar }));

const refreshMock = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/service", () => ({ refresh: refreshMock }));

import { getValidSession } from "@/services/auth/session";

const USER = { id: "u1", email: "a@b.c", name: "Ana" };

function jwtExpiringIn(seconds: number): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds }),
  ).toString("base64url");
  return `h.${payload}.s`;
}

function storeSession(token: string, refreshToken: string): void {
  cookieJar.get.mockReturnValue({
    value: JSON.stringify({ token, refreshToken, user: USER }),
  });
}

function refreshSucceeds(newToken: string, newRefreshToken: string) {
  return {
    result: { ok: true, status: 200, data: { token: newToken, user: USER } },
    newRefreshToken,
  };
}

describe("getValidSession: refresh concurrente", () => {
  beforeEach(() => {
    delete (globalThis as { __discordiaRefreshes?: unknown })
      .__discordiaRefreshes;
    storeSession(jwtExpiringIn(-60), "R1");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("no refresca si el access token todavia es valido", async () => {
    storeSession(jwtExpiringIn(600), "R1");

    const session = await getValidSession();

    expect(session?.refreshToken).toBe("R1");
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("dos requests simultaneas con el mismo refresh token refrescan una sola vez", async () => {
    refreshMock.mockResolvedValue(refreshSucceeds("T2", "R2"));

    const [a, b] = await Promise.all([getValidSession(), getValidSession()]);

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(a?.token).toBe("T2");
    expect(b?.token).toBe("T2");
    expect(b?.refreshToken).toBe("R2");
  });

  it("una request tardia con la cookie vieja reutiliza el resultado en vez de reusar R1", async () => {
    refreshMock.mockResolvedValue(refreshSucceeds("T2", "R2"));

    await getValidSession();
    // El navegador todavia no recibio el Set-Cookie y manda R1 otra vez.
    const late = await getValidSession();

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(late?.token).toBe("T2");
  });

  it("pasada la ventana vuelve a refrescar", async () => {
    vi.useFakeTimers();
    refreshMock.mockResolvedValue(refreshSucceeds("T2", "R2"));

    await getValidSession();
    await vi.advanceTimersByTimeAsync(30_000);
    await getValidSession();

    expect(refreshMock).toHaveBeenCalledTimes(2);
  });

  it("refresh tokens distintos no se mezclan", async () => {
    refreshMock.mockImplementation(async (refreshToken: string) =>
      refreshSucceeds(`T-${refreshToken}`, `${refreshToken}-next`),
    );

    const first = await getValidSession();
    storeSession(jwtExpiringIn(-60), "OTHER");
    const second = await getValidSession();

    expect(refreshMock).toHaveBeenCalledTimes(2);
    expect(first?.token).toBe("T-R1");
    expect(second?.token).toBe("T-OTHER");
  });

  it("un refresh fallido no se comparte: cierra la sesion y se reintenta con el backend", async () => {
    refreshMock.mockResolvedValue({
      result: { ok: false, status: 401, code: "SESSION_EXPIRED", message: "x" },
      newRefreshToken: null,
    });

    expect(await getValidSession()).toBeNull();
    expect(await getValidSession()).toBeNull();

    expect(refreshMock).toHaveBeenCalledTimes(2);
    expect(cookieJar.delete).toHaveBeenCalledTimes(2);
  });
});
