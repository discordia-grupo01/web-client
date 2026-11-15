import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BoostActionCard } from "./BoostActionCard";

function renderCard(blockReason: "cap" | "balance" | null, balance = 550) {
  render(
    <BoostActionCard
      serverName="Club de Lectura"
      balance={balance}
      blockReason={blockReason}
      onBoost={vi.fn()}
      onBuyPoints={vi.fn()}
    />,
  );
}

describe("BoostActionCard", () => {
  it("en el tope deshabilita el botón y explica cuándo se vuelve a poder", () => {
    renderCard("cap");

    const button = screen.getByRole("button", {
      name: "Nivel máximo alcanzado",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(
      screen.getByText(
        "Club de Lectura ya tiene los 30 boosts del nivel 3. Vas a poder boostear de nuevo si alguien retira uno.",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Ir a comprar puntos" }),
    ).toBeNull();
  });

  it("sin saldo dice cuánto falta y ofrece comprar", () => {
    renderCard("balance", 40);

    const button = screen.getByRole("button", {
      name: "Boostear por 100 puntos",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByText("Te faltan 60 puntos.")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ir a comprar puntos" }),
    ).toBeTruthy();
  });

  it("con saldo y lugar deja boostear", () => {
    renderCard(null);

    const button = screen.getByRole("button", {
      name: "Boostear por 100 puntos",
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });
});
