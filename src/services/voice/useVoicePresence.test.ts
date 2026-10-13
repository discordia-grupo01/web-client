import { VOICE_PARTICIPANTS_POLL_MS } from "@discordia/client-shared";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const listVoiceParticipantsRequest = vi.hoisted(() => vi.fn());
vi.mock("./client", () => ({ listVoiceParticipantsRequest }));

import { useVoicePresence } from "./useVoicePresence";

const ana = { participant_id: "u1", name: "Ana" };

beforeEach(() => {
  vi.useFakeTimers();
  listVoiceParticipantsRequest.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("useVoicePresence", () => {
  it("pide la presencia al montar y la vuelve a pedir cada intervalo", async () => {
    listVoiceParticipantsRequest.mockResolvedValue({
      ok: true,
      byChannel: { c1: [ana] },
    });

    const { result } = renderHook(() => useVoicePresence("s1"));
    await flush();

    expect(listVoiceParticipantsRequest).toHaveBeenCalledWith("s1");
    expect(result.current.byChannel).toEqual({ c1: [ana] });

    await act(async () => {
      vi.advanceTimersByTime(VOICE_PARTICIPANTS_POLL_MS);
    });
    expect(listVoiceParticipantsRequest).toHaveBeenCalledTimes(2);
  });

  it("si un pedido falla conserva lo ultimo que llego", async () => {
    listVoiceParticipantsRequest
      .mockResolvedValueOnce({ ok: true, byChannel: { c1: [ana] } })
      .mockResolvedValueOnce({ ok: false, message: "x" });

    const { result } = renderHook(() => useVoicePresence("s1"));
    await flush();
    await act(async () => {
      vi.advanceTimersByTime(VOICE_PARTICIPANTS_POLL_MS);
    });
    await flush();

    expect(result.current.byChannel).toEqual({ c1: [ana] });
  });

  it("al cambiar de servidor no muestra lo del anterior", async () => {
    listVoiceParticipantsRequest.mockResolvedValueOnce({
      ok: true,
      byChannel: { c1: [ana] },
    });
    listVoiceParticipantsRequest.mockReturnValueOnce(new Promise(() => {}));

    const { result, rerender } = renderHook(
      ({ serverId }) => useVoicePresence(serverId),
      { initialProps: { serverId: "s1" } },
    );
    await flush();
    rerender({ serverId: "s2" });

    expect(result.current.byChannel).toEqual({});
  });

  it("sin servidor no pide nada", () => {
    renderHook(() => useVoicePresence(null));
    expect(listVoiceParticipantsRequest).not.toHaveBeenCalled();
  });
});
