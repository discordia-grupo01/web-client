import {
  ACCOUNT_RECOVERY_CHALLENGE_EXPIRED,
  ACCOUNT_RECOVERY_UNAVAILABLE,
  ACCOUNT_SUSPENDED_MESSAGE,
} from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getChallengeToken = vi.hoisted(() => vi.fn());
const clearChallengeCookie = vi.hoisted(() => vi.fn());
vi.mock("@/services/two-factor/challenge-cookie", () => ({
  getChallengeToken,
  clearChallengeCookie,
}));

const requestAccountRecovery = vi.hoisted(() => vi.fn());
vi.mock("@/services/two-factor/service", () => ({ requestAccountRecovery }));

import { POST } from "./route";

const failure = (status: number, code = "X") => ({
  ok: false,
  status,
  code,
  message: "x",
});

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/auth/2fa/recovery-request", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getChallengeToken.mockReturnValue("challenge-123");
});

describe("POST /api/auth/2fa/recovery-request", () => {
  it("sin challenge avisa que la verificación venció y no llama al back", async () => {
    getChallengeToken.mockReturnValue(null);

    const response = await post({ message: "" });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      message: ACCOUNT_RECOVERY_CHALLENGE_EXPIRED,
      expired: true,
    });
    expect(requestAccountRecovery).not.toHaveBeenCalled();
  });

  it("manda el challenge de la cookie con el mensaje recortado y devuelve el email enmascarado", async () => {
    requestAccountRecovery.mockResolvedValue({
      ok: true,
      status: 201,
      data: {
        request_id: "r-1",
        status: "pending",
        email_hint: "a***a@gmail.com",
      },
    });

    const response = await post({ message: "  perdí el celular  " });

    expect(requestAccountRecovery).toHaveBeenCalledWith({
      challenge_token: "challenge-123",
      message: "perdí el celular",
    });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      ok: true,
      emailHint: "a***a@gmail.com",
    });
    expect(clearChallengeCookie).not.toHaveBeenCalled();
  });

  it("un mensaje de más de 500 caracteres no llega al back", async () => {
    const response = await post({ message: "a".repeat(501) });

    expect(response.status).toBe(400);
    expect(requestAccountRecovery).not.toHaveBeenCalled();
  });

  it("si ya hay una pendiente lo informa como resultado, no como error", async () => {
    requestAccountRecovery.mockResolvedValue(
      failure(409, "ACCOUNT_RECOVERY_ALREADY_PENDING"),
    );

    const response = await post({ message: "" });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, alreadyPending: true });
  });

  it("un 401 del back borra la cookie y avisa que venció", async () => {
    requestAccountRecovery.mockResolvedValue(
      failure(401, "TWO_FACTOR_CHALLENGE_EXPIRED"),
    );

    const response = await post({ message: "" });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      message: ACCOUNT_RECOVERY_CHALLENGE_EXPIRED,
      expired: true,
    });
    expect(clearChallengeCookie).toHaveBeenCalled();
  });

  it("con la cuenta suspendida muestra el aviso de suspensión", async () => {
    requestAccountRecovery.mockResolvedValue(failure(403, "ACCOUNT_SUSPENDED"));

    const response = await post({ message: "" });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      message: ACCOUNT_SUSPENDED_MESSAGE,
    });
  });

  it("si el back falla sale como 502 con el error para reintentar", async () => {
    requestAccountRecovery.mockResolvedValue(failure(500));

    const response = await post({ message: "" });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      ok: false,
      message: ACCOUNT_RECOVERY_UNAVAILABLE,
    });
  });
});
