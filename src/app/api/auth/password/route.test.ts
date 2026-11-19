import {
  CURRENT_PASSWORD_INVALID,
  PASSWORD_NOT_SET,
  SESSION_EXPIRED_MESSAGE,
} from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const changeAccountPassword = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/service", () => ({
  changeAccountPassword,
  setAccountPassword: vi.fn(),
}));

import { PUT } from "./route";

const validBody = {
  currentPassword: "Actual123",
  newPassword: "Nueva1234",
  confirmPassword: "Nueva1234",
};

const failure = (status: number, code: string) => ({
  ok: false,
  status,
  code,
  message: "x",
});

function put(body: unknown) {
  return PUT(
    new Request("http://localhost/api/auth/password", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "access-token" });
});

describe("PUT /api/auth/password", () => {
  it("manda los tres campos con la sesión y responde ok", async () => {
    changeAccountPassword.mockResolvedValue({ ok: true, data: undefined });

    const response = await put(validBody);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(changeAccountPassword).toHaveBeenCalledWith(
      "access-token",
      validBody,
    );
  });

  it("no llama al back si el formulario no pasa la validación", async () => {
    const response = await put({ ...validBody, currentPassword: "" });

    expect(response.status).toBe(400);
    expect(changeAccountPassword).not.toHaveBeenCalled();
  });

  it("trata el 403 como contraseña actual incorrecta y no cierra la sesión", async () => {
    changeAccountPassword.mockResolvedValue(failure(403, "INVALID_PASSWORD"));

    const response = await put(validBody);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      message: CURRENT_PASSWORD_INVALID,
    });
  });

  it("avisa que la cuenta no tiene contraseña", async () => {
    changeAccountPassword.mockResolvedValue(failure(409, "PASSWORD_NOT_SET"));

    const response = await put(validBody);

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      message: PASSWORD_NOT_SET,
      passwordNotSet: true,
    });
  });

  it("sin sesión responde 401", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await put(validBody);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      message: SESSION_EXPIRED_MESSAGE,
    });
    expect(changeAccountPassword).not.toHaveBeenCalled();
  });
});
