import {
  createPresenceStore,
  type UserRoomPush,
} from "@discordia/client-shared";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIdleReporter } from "@/components/home/hooks/useIdleReporter";

type PushMock = ReturnType<typeof vi.fn<Parameters<UserRoomPush>>>;

function activityCalls(push: PushMock) {
  return push.mock.calls.map(([, payload]) => payload);
}

describe("useIdleReporter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    const store = createPresenceStore("me");
    act(() => store.userRoomJoined({ status: "online", idle_after_ms: 1000 }));
    const push = vi.fn<Parameters<UserRoomPush>>(async () => ({
      ok: true as const,
    }));
    const hook = renderHook(() => useIdleReporter(store, push));
    return { store, push, ...hook };
  }

  it("avisa ausente tras el tiempo que mando el back sin interaccion", () => {
    const { push } = setup();

    act(() => vi.advanceTimersByTime(999));
    expect(push).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));

    expect(activityCalls(push)).toEqual([{ state: "idle" }]);
  });

  it("mover el mouse reinicia la cuenta y, si estaba ausente, avisa que volvio", () => {
    const { push } = setup();

    act(() => vi.advanceTimersByTime(800));
    act(() => window.dispatchEvent(new Event("pointermove")));
    act(() => vi.advanceTimersByTime(800));
    expect(push).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(200));
    act(() => window.dispatchEvent(new Event("keydown")));

    expect(activityCalls(push)).toEqual([
      { state: "idle" },
      { state: "active" },
    ]);
  });

  it("si se re-une la sala estando ausente, lo repite (la conexion nueva arranca activa)", () => {
    const { store, push } = setup();
    act(() => vi.advanceTimersByTime(1000));

    act(() => store.userRoomJoined({ status: "online", idle_after_ms: 1000 }));

    expect(activityCalls(push)).toEqual([{ state: "idle" }, { state: "idle" }]);
  });

  it("al desmontar deja de escuchar", () => {
    const { push, unmount } = setup();
    unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(push).not.toHaveBeenCalled();
  });
});
