import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listVoiceParticipantsRequest = vi.hoisted(() => vi.fn());
const connectVoicePresence = vi.hoisted(() => vi.fn());
vi.mock("@/services/voice/client", () => ({ listVoiceParticipantsRequest }));
vi.mock("@/services/voice/socket", () => ({ connectVoicePresence }));

import { useVoicePresence } from "@/components/servers/hooks/useVoicePresence";

const ana = { participant_id: "u1", name: "Ana" };

beforeEach(() => {
  listVoiceParticipantsRequest.mockReset().mockResolvedValue({
    ok: true,
    byChannel: {},
  });
  connectVoicePresence.mockReset().mockReturnValue(() => {});
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useVoicePresence", () => {
  it("pide un snapshot y se conecta al tópico del servidor", async () => {
    listVoiceParticipantsRequest.mockResolvedValue({
      ok: true,
      byChannel: { c1: [ana] },
    });

    const { result } = renderHook(() => useVoicePresence("s1"));
    await flush();

    expect(listVoiceParticipantsRequest).toHaveBeenCalledWith("s1");
    expect(connectVoicePresence).toHaveBeenCalledWith(
      "s1",
      expect.objectContaining({
        joined: expect.any(Function),
        left: expect.any(Function),
        rejoined: expect.any(Function),
      }),
    );
    expect(result.current.byChannel).toEqual({ c1: [ana] });
  });

  it("aplica altas y bajas recibidas por socket", async () => {
    listVoiceParticipantsRequest.mockResolvedValue({
      ok: true,
      byChannel: { c1: [ana] },
    });

    const { result } = renderHook(() => useVoicePresence("s1"));
    await flush();
    const handlers = connectVoicePresence.mock.calls[0][1];

    act(() =>
      handlers.joined({
        event_type: "voice.participant_joined",
        server_id: "s1",
        room_id: "c1",
        participant_id: "u2",
        name: "Beto",
      }),
    );
    expect(result.current.byChannel.c1).toEqual([
      ana,
      { participant_id: "u2", name: "Beto" },
    ]);

    act(() =>
      handlers.left({
        event_type: "voice.participant_left",
        server_id: "s1",
        room_id: "c1",
        participant_id: "u1",
        name: "Ana",
      }),
    );
    expect(result.current.byChannel).toEqual({
      c1: [{ participant_id: "u2", name: "Beto" }],
    });
  });

  it("conserva cambios del socket mientras llega el snapshot inicial", async () => {
    let resolveSnapshot: ((value: unknown) => void) | undefined;
    listVoiceParticipantsRequest.mockReturnValue(
      new Promise((resolve) => {
        resolveSnapshot = resolve;
      }),
    );

    const { result } = renderHook(() => useVoicePresence("s1"));
    await flush();
    const handlers = connectVoicePresence.mock.calls[0][1];

    act(() =>
      handlers.joined({
        event_type: "voice.participant_joined",
        server_id: "s1",
        room_id: "c1",
        participant_id: "u2",
        name: "Beto",
      }),
    );

    await act(async () => {
      resolveSnapshot?.({ ok: true, byChannel: { c1: [ana] } });
      await Promise.resolve();
    });

    expect(result.current.byChannel).toEqual({
      c1: [ana, { participant_id: "u2", name: "Beto" }],
    });
  });

  it("cierra el socket al cambiar de servidor", async () => {
    const disconnect = vi.fn();
    connectVoicePresence.mockReturnValue(disconnect);
    const { rerender } = renderHook(
      ({ serverId }) => useVoicePresence(serverId),
      { initialProps: { serverId: "s1" } },
    );

    await flush();
    await act(async () => {
      rerender({ serverId: "s2" });
    });
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it("vuelve a pedir el snapshot al reconectarse el socket", async () => {
    const { result } = renderHook(() => useVoicePresence("s1"));
    await flush();
    expect(listVoiceParticipantsRequest).toHaveBeenCalledOnce();

    listVoiceParticipantsRequest.mockResolvedValue({
      ok: true,
      byChannel: { c1: [ana] },
    });
    const handlers = connectVoicePresence.mock.calls[0][1];
    act(() => handlers.rejoined());
    await flush();

    expect(listVoiceParticipantsRequest).toHaveBeenCalledTimes(2);
    expect(result.current.byChannel).toEqual({ c1: [ana] });
  });

  it("no inicia polling periódico", async () => {
    const { unmount } = renderHook(() => useVoicePresence("s1"));
    await flush();
    await act(async () => {
      vi.advanceTimersByTime(5_001);
    });
    expect(listVoiceParticipantsRequest).toHaveBeenCalledOnce();
    unmount();
  });
});
