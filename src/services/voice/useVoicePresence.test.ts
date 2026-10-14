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

  it("forget saca a alguien de un canal sin esperar al back", async () => {
    const beto = { participant_id: "u2", name: "Beto" };
    listVoiceParticipantsRequest.mockResolvedValue({
      ok: true,
      byChannel: { c1: [ana, beto], c2: [ana] },
    });

    const { result } = renderHook(() => useVoicePresence("s1"));
    await flush();
    act(() => result.current.forget("c1", "u1"));

    expect(result.current.byChannel).toEqual({ c1: [beto], c2: [ana] });

    act(() => result.current.forget("c2", "u1"));
    expect(result.current.byChannel).toEqual({ c1: [beto] });
  });

  it("forget descarta un pedido en vuelo, que lo volveria a traer", async () => {
    listVoiceParticipantsRequest.mockResolvedValueOnce({
      ok: true,
      byChannel: { c1: [ana] },
    });
    let resolveStale: (value: unknown) => void = () => {};
    listVoiceParticipantsRequest.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStale = resolve;
      }),
    );

    const { result } = renderHook(() => useVoicePresence("s1"));
    await flush();
    act(() => result.current.refresh());
    act(() => result.current.forget("c1", "u1"));
    await act(async () => {
      resolveStale({ ok: true, byChannel: { c1: [ana] } });
      await Promise.resolve();
    });

    expect(result.current.byChannel).toEqual({});
  });

  it("lo olvidado sigue afuera aunque el poll lo traiga antes de confirmar", async () => {
    listVoiceParticipantsRequest.mockResolvedValue({
      ok: true,
      byChannel: { c1: [ana] },
    });

    const { result } = renderHook(() => useVoicePresence("s1"));
    await flush();
    act(() => result.current.forget("c1", "u1"));
    await act(async () => {
      vi.advanceTimersByTime(VOICE_PARTICIPANTS_POLL_MS);
    });
    await flush();

    expect(listVoiceParticipantsRequest).toHaveBeenCalledTimes(2);
    expect(result.current.byChannel).toEqual({});
  });

  it("confirm vuelve a mostrar lo que trae el back", async () => {
    listVoiceParticipantsRequest.mockResolvedValue({
      ok: true,
      byChannel: { c1: [ana] },
    });

    const { result } = renderHook(() => useVoicePresence("s1"));
    await flush();
    act(() => result.current.forget("c1", "u1"));
    expect(result.current.byChannel).toEqual({});

    act(() => result.current.confirm());
    await flush();

    expect(result.current.byChannel).toEqual({ c1: [ana] });
  });

  it("si se olvida de nuevo antes de que vuelva el confirm, sigue afuera", async () => {
    listVoiceParticipantsRequest.mockResolvedValueOnce({
      ok: true,
      byChannel: { c1: [ana] },
    });
    let resolveConfirm: (value: unknown) => void = () => {};
    listVoiceParticipantsRequest.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      }),
    );

    const { result } = renderHook(() => useVoicePresence("s1"));
    await flush();
    act(() => result.current.forget("c1", "u1"));
    act(() => result.current.confirm());
    act(() => result.current.forget("c2", "u1"));
    await act(async () => {
      resolveConfirm({ ok: true, byChannel: { c2: [ana] } });
      await Promise.resolve();
    });

    expect(result.current.byChannel).toEqual({});
  });

  it("sin servidor no pide nada", () => {
    renderHook(() => useVoicePresence(null));
    expect(listVoiceParticipantsRequest).not.toHaveBeenCalled();
  });
});
