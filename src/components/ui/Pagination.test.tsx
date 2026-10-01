import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("marca la pagina actual y muestra una ventana de cinco numeros", () => {
    render(<Pagination page={3} pageCount={44} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Página 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("button", { name: "Página 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Página 5" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Página 6" })).toBeNull();
  });

  it("navega con Anterior, Siguiente y los numeros", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} pageCount={10} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Anterior" }));
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await userEvent.click(screen.getByRole("button", { name: "Página 5" }));

    expect(onPageChange.mock.calls).toEqual([[2], [4], [5]]);
  });

  it("deshabilita Anterior en la primera pagina y Siguiente en la ultima", () => {
    const { rerender } = render(
      <Pagination page={1} pageCount={4} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled();

    rerender(<Pagination page={4} pageCount={4} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});
