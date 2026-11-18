import {
  BILLING_COPY,
  type LedgerEntry,
  type ServerSummary,
} from "@discordia/client-shared";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PointMovements } from "./PointMovements";

function makeServer(id: string, name: string): ServerSummary {
  return {
    id,
    name,
    description: "",
    icon: null,
    owner_id: "user-1",
    channels: [],
    member_count: 5,
    boost_count: 1,
    boost_level: 0,
    created_at: "2026-01-01T00:00:00Z",
    suspended: false,
    suspension_reason: null,
  };
}

describe("PointMovements", () => {
  it("muestra estado vacio cuando no hay movimientos", () => {
    render(<PointMovements ledger={[]} serverDirectory={null} />);
    expect(screen.getByText(BILLING_COPY.movementsEmpty)).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Buscar por servidor..."),
    ).not.toBeInTheDocument();
  });

  it("no muestra buscador si ningun movimiento tiene server_id", () => {
    const ledger: LedgerEntry[] = [
      {
        delta: 100,
        reason: "purchase",
        created_at: "2026-11-01T10:00:00Z",
      },
    ];
    render(<PointMovements ledger={ledger} serverDirectory={null} />);
    expect(
      screen.queryByPlaceholderText("Buscar por servidor..."),
    ).not.toBeInTheDocument();
  });

  it("muestra buscador y al enfocarlo o buscar muestra los servidores para filtrar", () => {
    const s1 = makeServer("srv-1", "Comunidad Alpha");
    const s2 = makeServer("srv-2", "Comunidad Beta");
    const serverDirectory = new Map<string, ServerSummary>([
      [s1.id, s1],
      [s2.id, s2],
    ]);

    const ledger: LedgerEntry[] = [
      {
        delta: -100,
        reason: "boost",
        server_id: "srv-1",
        created_at: "2026-11-01T10:00:00Z",
      },
      {
        delta: -100,
        reason: "boost",
        server_id: "srv-2",
        created_at: "2026-11-02T10:00:00Z",
      },
      {
        delta: -100,
        reason: "boost",
        server_id: "srv-unknown",
        created_at: "2026-11-03T10:00:00Z",
      },
      {
        delta: 500,
        reason: "purchase",
        created_at: "2026-11-04T10:00:00Z",
      },
    ];

    render(
      <PointMovements ledger={ledger} serverDirectory={serverDirectory} />,
    );

    // Search input is present
    const searchInput = screen.getByPlaceholderText("Buscar por servidor...");
    expect(searchInput).toBeInTheDocument();

    // All rows initially visible in list
    expect(screen.getByText("Comunidad Alpha")).toBeInTheDocument();
    expect(screen.getByText("Comunidad Beta")).toBeInTheDocument();
    expect(screen.getByText("Servidor desconocido")).toBeInTheDocument();

    // Focus input opens dropdown
    fireEvent.focus(searchInput);
    expect(screen.getAllByText("Comunidad Alpha").length).toBe(2); // row + dropdown option
    expect(screen.getAllByText("Comunidad Beta").length).toBe(2);
    expect(screen.getAllByText("Servidor desconocido").length).toBe(2);

    // Select Alpha from dropdown
    const option = screen.getByRole("button", { name: "Comunidad Alpha" });
    fireEvent.click(option);
    expect(searchInput).toHaveValue("Comunidad Alpha");
    expect(screen.getByText("Comunidad Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Comunidad Beta")).not.toBeInTheDocument();

    // Clear filter
    const clearBtn = screen.getByRole("button", {
      name: "Limpiar filtro de servidor",
    });
    fireEvent.click(clearBtn);
    expect(searchInput).toHaveValue("");
    expect(screen.getByText("Comunidad Beta")).toBeInTheDocument();

    // Search by typing
    fireEvent.change(searchInput, { target: { value: "Beta" } });
    expect(screen.getAllByText("Comunidad Beta").length).toBe(2); // dropdown item + row
    expect(screen.queryByText("Comunidad Alpha")).not.toBeInTheDocument();
  });
});
