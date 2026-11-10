import {
  BILLING_ERROR_MESSAGES,
  NETWORK_ERROR_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
} from "@discordia/client-shared";
import { describe, expect, it } from "vitest";

import {
  billingFailureResponse,
  idempotencyKeyOf,
  readJsonBody,
} from "./billingRoute";

describe("billingFailureResponse", () => {
  it("un 401 del back es sesión vencida", async () => {
    const response = billingFailureResponse(
      { ok: false, status: 401, code: "UNAUTHORIZED", message: "x" },
      "fallback.",
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      ok: false,
      message: SESSION_EXPIRED_MESSAGE,
    });
  });

  it("traduce los códigos de billing y los reenvía", async () => {
    const response = billingFailureResponse(
      { ok: false, status: 409, code: "ALREADY_SUBSCRIBED", message: "x" },
      "fallback.",
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      message: BILLING_ERROR_MESSAGES.ALREADY_SUBSCRIBED,
      code: "ALREADY_SUBSCRIBED",
    });
  });

  it("traduce los errores de idempotencia del checkout", async () => {
    const response = billingFailureResponse(
      { ok: false, status: 409, code: "CHECKOUT_IN_PROGRESS", message: "x" },
      "fallback.",
    );

    expect(await response.json()).toEqual({
      ok: false,
      message: BILLING_ERROR_MESSAGES.CHECKOUT_IN_PROGRESS,
      code: "CHECKOUT_IN_PROGRESS",
    });
  });

  it("un error desconocido usa el mensaje de la operación y sale como 502", async () => {
    const response = billingFailureResponse(
      { ok: false, status: 503, code: "UNKNOWN_ERROR", message: "x" },
      "fallback.",
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ ok: false, message: "fallback." });
  });

  it("sin red conserva el mensaje de conexión", async () => {
    const response = billingFailureResponse(
      {
        ok: false,
        status: 0,
        code: "NETWORK_ERROR",
        message: NETWORK_ERROR_MESSAGE,
      },
      "fallback.",
    );

    expect(await response.json()).toEqual({
      ok: false,
      message: NETWORK_ERROR_MESSAGE,
    });
  });
});

describe("readJsonBody", () => {
  it("devuelve el objeto del body", async () => {
    const request = new Request("http://x", {
      method: "POST",
      body: JSON.stringify({ package_id: "points_100" }),
    });
    expect(await readJsonBody(request)).toEqual({ package_id: "points_100" });
  });

  it("un body roto o que no es objeto queda vacío", async () => {
    expect(
      await readJsonBody(
        new Request("http://x", { method: "POST", body: "{" }),
      ),
    ).toEqual({});
    expect(
      await readJsonBody(
        new Request("http://x", { method: "POST", body: "null" }),
      ),
    ).toEqual({});
  });
});

describe("idempotencyKeyOf", () => {
  function request(headers?: HeadersInit): Request {
    return new Request("http://localhost/api/billing/points/checkout", {
      method: "POST",
      headers,
    });
  }

  it("lee el header", () => {
    expect(idempotencyKeyOf(request({ "Idempotency-Key": " k1 " }))).toBe("k1");
  });

  it("sin header o vacío no manda clave", () => {
    expect(idempotencyKeyOf(request())).toBeUndefined();
    expect(
      idempotencyKeyOf(request({ "Idempotency-Key": "  " })),
    ).toBeUndefined();
  });
});
