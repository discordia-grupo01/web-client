import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActivityStatusRow } from "./ActivityStatusRow";

function stubViewport(wide: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: wide,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each([
  ["pantalla ancha", true],
  ["pantalla angosta", false],
])("ActivityStatusRow en %s", (_name, wide) => {
  it("muestra el estado actual y no las opciones hasta abrir", () => {
    stubViewport(wide);
    render(<ActivityStatusRow status="idle" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Ausente/ })).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("al abrir ofrece las cuatro opciones", async () => {
    stubViewport(wide);
    render(<ActivityStatusRow status="online" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /En línea/ }));

    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "En línea",
      "Ausente",
      "No molestar" + "No recibirás notificaciones de escritorio",
      "Invisible" + "Aparecerás como desconectado",
    ]);
    expect(screen.getByRole("option", { name: /En línea/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("elegir una opcion avisa y cierra", async () => {
    stubViewport(wide);
    const onChange = vi.fn();
    render(<ActivityStatusRow status="online" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /En línea/ }));
    await userEvent.click(screen.getByRole("option", { name: /Invisible/ }));

    expect(onChange).toHaveBeenCalledWith("invisible");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Escape cierra sin cambiar nada", async () => {
    stubViewport(wide);
    const onChange = vi.fn();
    render(<ActivityStatusRow status="online" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /En línea/ }));
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("click afuera cierra sin cambiar nada", async () => {
    stubViewport(wide);
    const onChange = vi.fn();
    render(
      <>
        <p>afuera</p>
        <ActivityStatusRow status="online" onChange={onChange} />
      </>,
    );

    await userEvent.click(screen.getByRole("button", { name: /En línea/ }));
    await userEvent.click(screen.getByText("afuera"));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
