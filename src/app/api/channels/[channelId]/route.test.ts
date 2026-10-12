import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getValidSession = vi.hoisted(() => vi.fn());
vi.mock("@/services/auth/session", () => ({ getValidSession }));

const updateChannel = vi.hoisted(() => vi.fn());
const deleteChannel = vi.hoisted(() => vi.fn());
vi.mock("@/services/channels/service", () => ({
  updateChannel,
  deleteChannel,
}));

import { PATCH } from "./route";

const context = { params: { channelId: "ch1" } };
const CHANNEL = {
  id: "ch1",
  name: "general",
  kind: "text",
  position: 0,
  category_id: null,
  topic: "Charla",
};

function patch(body: unknown) {
  return PATCH(
    new Request("http://localhost/api/channels/ch1", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
    context,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getValidSession.mockResolvedValue({ token: "jwt" });
  updateChannel.mockResolvedValue({ ok: true, status: 200, data: CHANNEL });
});

describe("PATCH /api/channels/:channelId", () => {
  it("manda solo el tema cuando es lo unico que cambio", async () => {
    const response = await patch({ topic: "Charla" });

    expect(updateChannel).toHaveBeenCalledWith("jwt", "ch1", {
      topic: "Charla",
    });
    expect(await response.json()).toEqual({ ok: true, channel: CHANNEL });
  });

  it("un tema vacio se manda para borrarlo", async () => {
    await patch({ topic: "" });

    expect(updateChannel).toHaveBeenCalledWith("jwt", "ch1", { topic: "" });
  });

  it("manda nombre y tema juntos", async () => {
    await patch({ name: "general", topic: "Charla" });

    expect(updateChannel).toHaveBeenCalledWith("jwt", "ch1", {
      name: "general",
      topic: "Charla",
    });
  });
});
