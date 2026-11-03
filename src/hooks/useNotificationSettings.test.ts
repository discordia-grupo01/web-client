import type { NotificationSettingsResponse } from "@discordia/client-shared";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listNotificationSettingsRequest = vi.fn();
const updateChannelNotificationSettingsRequest = vi.fn();
const updateServerNotificationSettingsRequest = vi.fn();

vi.mock("@/services/notifications/client", () => ({
  listNotificationSettingsRequest: (...args: unknown[]) =>
    listNotificationSettingsRequest(...args),
  updateChannelNotificationSettingsRequest: (...args: unknown[]) =>
    updateChannelNotificationSettingsRequest(...args),
  updateServerNotificationSettingsRequest: (...args: unknown[]) =>
    updateServerNotificationSettingsRequest(...args),
}));

import { useNotificationSettings } from "@/hooks/useNotificationSettings";

const listing = (
  overrides: Partial<NotificationSettingsResponse> = {},
): { ok: true } & NotificationSettingsResponse => ({
  ok: true,
  servers: [],
  channels: [],
  preferences: { servers: [], channels: [] },
  ...overrides,
});

async function renderLoaded(initial = listing()) {
  listNotificationSettingsRequest.mockResolvedValue(initial);
  const hook = renderHook(() => useNotificationSettings());
  await waitFor(() => expect(hook.result.current.status).toBe("ready"));
  return hook;
}

describe("useNotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga lo guardado al montar", async () => {
    const { result } = await renderLoaded(
      listing({
        servers: ["s1"],
        channels: [{ channel_id: "c1", server_id: "s2" }],
        preferences: {
          servers: [{ server_id: "s3", level: "all" }],
          channels: [{ channel_id: "c2", server_id: "s3", level: "none" }],
        },
      }),
    );

    expect(result.current.settings).toEqual({
      mutedServers: { s1: true },
      mutedChannels: { c1: true },
      serverLevels: { s3: "all" },
      channelLevels: { c2: "none" },
    });
  });

  it("pasa a error si no puede cargar", async () => {
    listNotificationSettingsRequest.mockResolvedValue({
      ok: false,
      message: "x",
    });

    const { result } = renderHook(() => useNotificationSettings());

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("silencia un canal y se queda con lo que responde el back", async () => {
    updateChannelNotificationSettingsRequest.mockResolvedValue({
      ok: true,
      muted: true,
      level: null,
    });
    const { result } = await renderLoaded();

    let saved: unknown;
    await act(async () => {
      saved = await result.current.setChannel("c1", { muted: true });
    });

    expect(saved).toEqual({ ok: true });
    expect(updateChannelNotificationSettingsRequest).toHaveBeenCalledWith(
      "c1",
      { muted: true },
    );
    expect(result.current.settings.mutedChannels).toEqual({ c1: true });
  });

  it("muestra el cambio antes de que responda el back", async () => {
    let resolve: (value: unknown) => void = () => {};
    updateChannelNotificationSettingsRequest.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { result } = await renderLoaded();

    act(() => {
      void result.current.setChannel("c1", { level: "all" });
    });

    expect(result.current.settings.channelLevels).toEqual({ c1: "all" });

    await act(async () => {
      resolve({ ok: true, muted: false, level: "all" });
    });
  });

  it("deshace el cambio si el back falla", async () => {
    updateServerNotificationSettingsRequest.mockResolvedValue({
      ok: false,
      message: "No pudimos guardar",
    });
    const { result } = await renderLoaded(
      listing({
        preferences: {
          servers: [{ server_id: "s1", level: "all" }],
          channels: [],
        },
      }),
    );

    let saved: unknown;
    await act(async () => {
      saved = await result.current.setServer("s1", {
        muted: true,
        level: "none",
      });
    });

    expect(saved).toEqual({ ok: false, message: "No pudimos guardar" });
    expect(result.current.settings.mutedServers).toEqual({});
    expect(result.current.settings.serverLevels).toEqual({ s1: "all" });
  });

  it("borra el nivel cuando se manda null", async () => {
    updateChannelNotificationSettingsRequest.mockResolvedValue({
      ok: true,
      muted: false,
      level: null,
    });
    const { result } = await renderLoaded(
      listing({
        preferences: {
          servers: [],
          channels: [{ channel_id: "c1", server_id: "s1", level: "none" }],
        },
      }),
    );

    await act(async () => {
      await result.current.setChannel("c1", { level: null });
    });

    expect(result.current.settings.channelLevels).toEqual({});
  });

  it("al deshacer un cambio no pisa lo que ya estaba guardado de otros canales", async () => {
    updateChannelNotificationSettingsRequest.mockImplementation(
      (channelId: string) =>
        Promise.resolve(
          channelId === "c2"
            ? { ok: false, message: "x" }
            : { ok: true, muted: true, level: null },
        ),
    );
    const { result } = await renderLoaded();

    await act(async () => {
      await result.current.setChannel("c1", { muted: true });
      await result.current.setChannel("c2", { muted: true });
    });

    expect(result.current.settings.mutedChannels).toEqual({ c1: true });
  });
});
