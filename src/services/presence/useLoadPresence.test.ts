import { createPresenceStore, presenceOf } from "@discordia/client-shared";

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listPresenceRequest = vi.fn();

vi.mock("./client", () => ({
  listPresenceRequest: (...args: unknown[]) => listPresenceRequest(...args),
}));

import { useLoadPresence } from "./useLoadPresence";

describe("useLoadPresence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listPresenceRequest.mockResolvedValue({
      ok: true,
      presences: [{ user_id: "a", status: "dnd", version: 2 }],
    });
  });

  it("pide el estado de los ids y lo suma al store", async () => {
    const store = createPresenceStore("me");
    renderHook(() => useLoadPresence(store, ["a", "b", "a"]));

    await waitFor(() =>
      expect(presenceOf(store.getState().presences, "a")).toBe("dnd"),
    );
    expect(listPresenceRequest).toHaveBeenCalledWith(["a", "b"]);
  });

  it("sin ids no pide nada", () => {
    renderHook(() => useLoadPresence(createPresenceStore("me"), []));
    expect(listPresenceRequest).not.toHaveBeenCalled();
  });

  it("vuelve a pedir cuando se re-une la sala personal", async () => {
    const store = createPresenceStore("me");
    renderHook(() => useLoadPresence(store, ["a"]));
    await waitFor(() => expect(listPresenceRequest).toHaveBeenCalledTimes(1));

    act(() => store.userRoomJoined({ status: "online" }));

    await waitFor(() => expect(listPresenceRequest).toHaveBeenCalledTimes(2));
  });
});
