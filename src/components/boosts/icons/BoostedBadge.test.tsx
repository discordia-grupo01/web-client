import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BoostedBadge } from "./BoostedBadge";

describe("BoostedBadge", () => {
  it("se anuncia y muestra el cartel al pasar el mouse", () => {
    render(<BoostedBadge size={18} />);

    const badge = screen.getByRole("img", { name: "Servidor Boosteado" });
    expect(badge.querySelector("title")?.textContent).toBe(
      "Servidor Boosteado · Nivel 3",
    );
    expect(badge.querySelector("polygon")?.getAttribute("stroke-width")).toBe(
      "1.6",
    );
  });

  it("decorativo no se lee", () => {
    const { container } = render(<BoostedBadge decorative />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("title")).toBeNull();
  });

  it("fuerza el tema del borde sobre fondos fijos", () => {
    const { container } = render(<BoostedBadge surface="dark" />);

    expect(container.querySelector("svg")?.getAttribute("data-theme")).toBe(
      "dark",
    );
  });
});
