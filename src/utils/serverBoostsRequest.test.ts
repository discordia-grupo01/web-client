import { describe, expect, it, vi } from "vitest";

import {
  onServerBoostsRequested,
  requestServerBoosts,
  takeRequestedServerBoosts,
} from "./serverBoostsRequest";

describe("serverBoostsRequest", () => {
  it("avisa el servidor y la pestaña pedida", () => {
    const listener = vi.fn();
    const stop = onServerBoostsRequested(listener);

    requestServerBoosts("s1", "benefits");
    stop();

    expect(listener).toHaveBeenCalledWith("s1", "benefits");
  });

  it("guarda el pedido hasta que lo toma ese servidor", () => {
    requestServerBoosts("s1");

    expect(takeRequestedServerBoosts("s2")).toBeNull();
    expect(takeRequestedServerBoosts("s1")).toBe("boost");
    expect(takeRequestedServerBoosts("s1")).toBeNull();
  });
});
