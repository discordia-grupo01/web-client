import {
  CHANNEL_OVERRIDE_REASONS,
  OWNER_ONLY_OVERRIDE_CHANNEL_PERMISSIONS,
} from "@discordia/client-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const listChannelOverrides = vi.hoisted(() => vi.fn());
const setChannelOverride = vi.hoisted(() => vi.fn());
const deleteChannelOverride = vi.hoisted(() => vi.fn());
vi.mock("@/services/channel-permissions/service", () => ({
  listChannelOverrides,
  setChannelOverride,
  deleteChannelOverride,
}));

import { DELETE, GET, PUT } from "./route";

const context = { params: { channelId: "ch1" } };

function withBody(method: string, body: unknown) {
  return new Request("http://localhost/api/channels/ch1/permissions", {
    method,
    body: JSON.stringify(body),
  });
}

function failure(status: number, details?: Record<string, unknown>) {
  return { ok: false, status, code: status, message: "x", details };
}

const OVERRIDE = {
  channel_id: "ch1",
  role_id: "r1",
  allow: ["SEND_MESSAGES"],
  deny: ["VIEW_CHANNELS"],
  updated_at: "2026-10-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt", user: { id: "u1" } });
});

describe("GET /api/channels/:channelId/permissions", () => {
  it("responde 401 sin sesion y no llama al back", async () => {
    getValidSession.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(401);
    expect(listChannelOverrides).not.toHaveBeenCalled();
  });

  it("devuelve las excepciones del canal", async () => {
    listChannelOverrides.mockResolvedValue({
      ok: true,
      status: 200,
      data: [OVERRIDE],
    });

    const response = await GET(new Request("http://localhost"), context);

    expect(listChannelOverrides).toHaveBeenCalledWith("jwt", "ch1");
    expect(await response.json()).toEqual({ ok: true, overrides: [OVERRIDE] });
  });

  it("sin MANAGE_ROLES responde 403 y marca permissionDenied", async () => {
    listChannelOverrides.mockResolvedValue(failure(403));

    const response = await GET(new Request("http://localhost"), context);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      message: OWNER_ONLY_OVERRIDE_CHANNEL_PERMISSIONS,
      permissionDenied: true,
    });
  });
});

describe("PUT /api/channels/:channelId/permissions", () => {
  it("manda allow y deny del rol al back", async () => {
    setChannelOverride.mockResolvedValue({
      ok: true,
      status: 200,
      data: OVERRIDE,
    });

    const response = await PUT(
      withBody("PUT", {
        roleId: "r1",
        allow: ["SEND_MESSAGES"],
        deny: ["VIEW_CHANNELS"],
      }),
      context,
    );

    expect(setChannelOverride).toHaveBeenCalledWith("jwt", "ch1", "r1", {
      allow: ["SEND_MESSAGES"],
      deny: ["VIEW_CHANNELS"],
    });
    expect(await response.json()).toEqual({ ok: true, override: OVERRIDE });
  });

  it("el 204 del back (listas vacias) es una excepcion borrada", async () => {
    setChannelOverride.mockResolvedValue({ ok: true, status: 204, data: null });

    const response = await PUT(
      withBody("PUT", { roleId: "r1", allow: [], deny: [] }),
      context,
    );

    expect(await response.json()).toEqual({ ok: true, override: null });
  });

  it("rechaza sin llamar al back un permiso que no se puede sobrescribir", async () => {
    const response = await PUT(
      withBody("PUT", { roleId: "r1", allow: ["BAN_MEMBERS"], deny: [] }),
      context,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      message: CHANNEL_OVERRIDE_REASONS.permission_not_overridable,
    });
    expect(setChannelOverride).not.toHaveBeenCalled();
  });

  it("sin roleId responde 400", async () => {
    const response = await PUT(
      withBody("PUT", { allow: [], deny: [] }),
      context,
    );

    expect(response.status).toBe(400);
    expect(setChannelOverride).not.toHaveBeenCalled();
  });

  it("un rol por encima del actor se traduce con su motivo", async () => {
    setChannelOverride.mockResolvedValue(
      failure(403, { reason: "role_above_own" }),
    );

    const response = await PUT(
      withBody("PUT", { roleId: "r1", allow: [], deny: ["SEND_MESSAGES"] }),
      context,
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      message: CHANNEL_OVERRIDE_REASONS.role_above_own,
    });
  });

  it("permitir un permiso que el actor no tiene nombra el permiso", async () => {
    setChannelOverride.mockResolvedValue(
      failure(403, {
        reason: "permission_not_held",
        permissions: ["MANAGE_MESSAGES"],
      }),
    );

    const response = await PUT(
      withBody("PUT", { roleId: "r1", allow: ["MANAGE_MESSAGES"], deny: [] }),
      context,
    );
    const body = await response.json();

    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/Gestionar mensajes/);
    expect(body.permissionDenied).toBeUndefined();
  });

  it("un error del back que no es 4xx sale como 502", async () => {
    setChannelOverride.mockResolvedValue(failure(500));

    const response = await PUT(
      withBody("PUT", { roleId: "r1", allow: [], deny: ["SEND_MESSAGES"] }),
      context,
    );

    expect(response.status).toBe(502);
  });
});

describe("DELETE /api/channels/:channelId/permissions", () => {
  it("borra la excepcion del rol", async () => {
    deleteChannelOverride.mockResolvedValue({
      ok: true,
      status: 204,
      data: null,
    });

    const response = await DELETE(
      withBody("DELETE", { roleId: "r1" }),
      context,
    );

    expect(deleteChannelOverride).toHaveBeenCalledWith("jwt", "ch1", "r1");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("que el rol ya no tuviera excepcion cuenta como exito", async () => {
    deleteChannelOverride.mockResolvedValue(
      failure(404, { reason: "channel_override_not_found" }),
    );

    const response = await DELETE(
      withBody("DELETE", { roleId: "r1" }),
      context,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
