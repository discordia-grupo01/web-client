import { toServerBoostSummary } from "@discordia/client-shared";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BoostStatusCard } from "./BoostStatusCard";

describe("BoostStatusCard", () => {
  it("muestra el nivel, los boosts y cuánto falta para el próximo", () => {
    render(
      <BoostStatusCard
        summary={toServerBoostSummary({ boost_count: 7, level: 1 })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Nivel 1" })).toBeTruthy();
    expect(screen.getByText("7 boosts")).toBeTruthy();
    expect(
      screen.getByText("Activos: más emojis e ícono animado."),
    ).toBeTruthy();
    expect(screen.getByText("8 boosts")).toBeTruthy();
    expect(screen.getByText("7 / 15")).toBeTruthy();
    expect(
      screen.getByRole("progressbar", {
        name: "7 de 15 boosts para el nivel 2",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText("banner del servidor · adjuntos de 25 MB"),
    ).toBeTruthy();
  });

  it("en el nivel 0 muestra que todavía no hay beneficios", () => {
    render(
      <BoostStatusCard
        summary={toServerBoostSummary({ boost_count: 2, level: 0 })}
      />,
    );

    expect(
      screen.getByText("Todavía no tiene beneficios de boosts."),
    ).toBeTruthy();
    expect(screen.getByText("3 boosts")).toBeTruthy();
  });

  it("en el nivel máximo no muestra barra ni próximo nivel", () => {
    render(
      <BoostStatusCard
        summary={toServerBoostSummary({ boost_count: 32, level: 3 })}
      />,
    );

    expect(screen.getByText("Alcanzó el nivel máximo")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText("Próximo")).toBeNull();
  });
});
