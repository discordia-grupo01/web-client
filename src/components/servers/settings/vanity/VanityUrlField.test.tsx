import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VanityUrlField } from "./VanityUrlField";

const setVanityCodeRequest = vi.fn();

vi.mock("@/services/servers/client", () => ({
  setVanityCodeRequest: (...args: unknown[]) => setVanityCodeRequest(...args),
}));

beforeEach(() => {
  setVanityCodeRequest.mockReset();
});

function renderField(level: 0 | 1 | 2 | 3, vanityCode: string | null = null) {
  render(
    <VanityUrlField
      serverId="s1"
      serverName="Club de Lectura"
      level={level}
      boostCount={[3, 5, 18, 30][level]}
      vanityCode={vanityCode}
    />,
  );
}

describe("VanityUrlField", () => {
  it("debajo del nivel 3 está bloqueada", () => {
    renderField(2);

    expect(screen.getByText("Faltan 12 boosts para el nivel 3")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("en el nivel 3 propone un código a partir del nombre", () => {
    renderField(3);

    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(
      "club-de-lectura",
    );
  });

  it("no deja guardar un código inválido", async () => {
    renderField(3);
    const input = screen.getByRole("textbox");

    await userEvent.clear(input);
    await userEvent.type(input, "club_lectura");

    expect(
      screen.getByText("Usá solo minúsculas, números y guiones."),
    ).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Guardar" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("guarda y muestra el link con sus acciones", async () => {
    setVanityCodeRequest.mockResolvedValue({
      ok: true,
      vanity_code: "club-de-lectura",
    });
    renderField(3);

    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(setVanityCodeRequest).toHaveBeenCalledWith("s1", "club-de-lectura");
    expect(await screen.findByRole("button", { name: "Copiar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cambiar" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Quitar" })).toBeNull();
  });

  it("muestra el error del 409", async () => {
    setVanityCodeRequest.mockResolvedValue({
      ok: false,
      message: "Ese link ya lo usa otro servidor. Probá con otro.",
    });
    renderField(3);

    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText(
        "Ese link ya lo usa otro servidor. Probá con otro.",
      ),
    ).toBeTruthy();
  });
});
