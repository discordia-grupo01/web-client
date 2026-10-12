import type { ChannelOverride } from "@discordia/client-shared";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteChannelOverrideRequest,
  listChannelOverridesRequest,
  setChannelOverrideRequest,
} from "./client";
import { useChannelOverrides } from "./useChannelOverrides";

vi.mock("./client", () => ({
  listChannelOverridesRequest: vi.fn(),
  setChannelOverrideRequest: vi.fn(),
  deleteChannelOverrideRequest: vi.fn(),
}));

const list = vi.mocked(listChannelOverridesRequest);
const put = vi.mocked(setChannelOverrideRequest);
const remove = vi.mocked(deleteChannelOverrideRequest);

function override(
  roleId: string,
  allow: ChannelOverride["allow"],
  deny: ChannelOverride["deny"],
): ChannelOverride {
  return {
    channel_id: "ch1",
    role_id: roleId,
    allow,
    deny,
    updated_at: "2026-10-01T00:00:00Z",
  };
}

async function renderLoaded(overrides: ChannelOverride[] = []) {
  list.mockResolvedValue({ ok: true, overrides });
  const hook = renderHook(() => useChannelOverrides("ch1", "everyone", true));
  await waitFor(() => expect(hook.result.current.status).toBe("ready"));
  return hook;
}

beforeEach(() => {
  vi.clearAllMocks();
  put.mockResolvedValue({ ok: true, override: null });
  remove.mockResolvedValue({ ok: true });
});

describe("useChannelOverrides", () => {
  it("no pide nada sin permiso para editar", () => {
    renderHook(() => useChannelOverrides("ch1", "everyone", false));

    expect(list).not.toHaveBeenCalled();
  });

  it("arranca con @everyone en el borrador aunque no tenga excepcion", async () => {
    const { result } = await renderLoaded([
      override("mods", ["MANAGE_MESSAGES"], []),
    ]);

    expect(result.current.draft).toEqual({
      everyone: {},
      mods: { MANAGE_MESSAGES: "allow" },
    });
    expect(result.current.hasChanges).toBe(false);
  });

  it("un error al cargar queda en loadError y se puede reintentar", async () => {
    list.mockResolvedValueOnce({ ok: false, message: "fallo" });
    const { result } = renderHook(() =>
      useChannelOverrides("ch1", "everyone", true),
    );
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.loadError).toBe("fallo");

    list.mockResolvedValue({ ok: true, overrides: [] });
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("agregar un rol sin marcar nada no es un cambio", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.addRole("mods"));

    expect(result.current.draft).toHaveProperty("mods");
    expect(result.current.hasChanges).toBe(false);
  });

  it("al guardar manda @everyone primero y solo los roles que cambiaron", async () => {
    const { result } = await renderLoaded([
      override("vip", ["SEND_MESSAGES"], []),
    ]);

    act(() => {
      result.current.addRole("mods");
      result.current.setValue("mods", "MANAGE_MESSAGES", "allow");
      result.current.setValue("everyone", "VIEW_CHANNELS", "deny");
    });
    expect(result.current.hasChanges).toBe(true);

    list.mockResolvedValue({
      ok: true,
      overrides: [
        override("everyone", [], ["VIEW_CHANNELS"]),
        override("vip", ["SEND_MESSAGES"], []),
        override("mods", ["MANAGE_MESSAGES"], []),
      ],
    });
    let failures: unknown;
    await act(async () => {
      failures = await result.current.save();
    });

    expect(failures).toEqual([]);
    expect(put.mock.calls).toEqual([
      ["ch1", { roleId: "everyone", allow: [], deny: ["VIEW_CHANNELS"] }],
      ["ch1", { roleId: "mods", allow: ["MANAGE_MESSAGES"], deny: [] }],
    ]);
    expect(result.current.hasChanges).toBe(false);
  });

  it("limpiar un rol con excepcion guardada la borra", async () => {
    const { result } = await renderLoaded([
      override("vip", ["SEND_MESSAGES"], []),
    ]);

    act(() => result.current.clearRole("vip"));
    list.mockResolvedValue({ ok: true, overrides: [] });
    await act(async () => {
      await result.current.save();
    });

    expect(remove).toHaveBeenCalledWith("ch1", "vip");
    expect(put).not.toHaveBeenCalled();
  });

  it("si un rol falla, conserva lo que se habia marcado para reintentar", async () => {
    const { result } = await renderLoaded();
    act(() => {
      result.current.addRole("mods");
      result.current.setValue("mods", "SEND_MESSAGES", "deny");
    });
    put.mockResolvedValueOnce({
      ok: false,
      message: "No podés cambiar ese rol",
    });

    let failures: unknown;
    await act(async () => {
      failures = await result.current.save();
    });

    expect(failures).toEqual([
      {
        roleId: "mods",
        message: "No podés cambiar ese rol",
        permissionDenied: false,
      },
    ]);
    expect(result.current.draft?.mods).toEqual({ SEND_MESSAGES: "deny" });
    expect(result.current.hasChanges).toBe(true);
  });

  it("restablecer vuelve a lo guardado", async () => {
    const { result } = await renderLoaded();
    act(() => result.current.setValue("everyone", "ADD_REACTIONS", "deny"));

    act(() => result.current.reset());

    expect(result.current.draft).toEqual({ everyone: {} });
    expect(result.current.hasChanges).toBe(false);
  });
});
