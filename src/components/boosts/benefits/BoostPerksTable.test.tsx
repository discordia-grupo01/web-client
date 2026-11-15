import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BoostPerksTable } from "./BoostPerksTable";

describe("BoostPerksTable", () => {
  it("tiene una fila por beneficio y marca el nivel actual", () => {
    render(<BoostPerksTable level={2} />);

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(7);
    expect(screen.getByText("5 boosts")).toBeTruthy();
    expect(screen.getByText("15 boosts · actual")).toBeTruthy();
  });

  it("muestra cantidades y lo que incluye cada nivel", () => {
    render(<BoostPerksTable level={0} />);

    const emojis = screen.getByRole("row", { name: /Emojis personalizados/ });
    expect(within(emojis).getAllByText("70")).toHaveLength(3);
    const banner = screen.getByRole("row", { name: /Banner del servidor/ });
    expect(within(banner).getAllByText("Incluido")).toHaveLength(2);
    expect(within(banner).getAllByText("No incluido")).toHaveLength(2);
  });
});
