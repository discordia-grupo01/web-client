import { type ServerSummary } from "@discordia/client-shared";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MutualServersList } from "./MutualServersList";

const listServersRequest = vi.fn();

vi.mock("@/services/servers/client", () => ({
  listServersRequest: () => listServersRequest(),
}));

function server(overrides: Partial<ServerSummary>): ServerSummary {
  return {
    id: "server-id",
    name: "Servidor",
    icon_url: null,
    banner_url: null,
    owner_id: "owner-id",
    created_at: "2026-11-10T00:00:00Z",
    channels: [],
    categories: [],
    ...overrides,
  };
}

describe("MutualServersList", () => {
  it("muestra la inicial para un servidor sin ícono, no una imagen rota", async () => {
    listServersRequest.mockResolvedValue({
      ok: true,
      servers: [server({ id: "s1", name: "Suspender", icon_url: null })],
    });

    const { container } = render(<MutualServersList serverIds={["s1"]} />);

    expect(await screen.findByText("Suspender")).toBeInTheDocument();
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
  });

  it("pide el ícono por el BFF con la versión del back", async () => {
    listServersRequest.mockResolvedValue({
      ok: true,
      servers: [
        server({
          id: "s2",
          name: "Reunión IS2",
          icon_url: "/v1/servers/s2/icon?v=abc123",
        }),
      ],
    });

    const { container } = render(<MutualServersList serverIds={["s2"]} />);

    await screen.findByText("Reunión IS2");
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/api/servers/s2/icon?v=abc123",
    );
  });

  it("solo lista los servidores en común", async () => {
    listServersRequest.mockResolvedValue({
      ok: true,
      servers: [
        server({ id: "s1", name: "En común" }),
        server({ id: "s3", name: "Solo mío" }),
      ],
    });

    render(<MutualServersList serverIds={["s1"]} />);

    expect(await screen.findByText("En común")).toBeInTheDocument();
    expect(screen.queryByText("Solo mío")).toBeNull();
  });
});
