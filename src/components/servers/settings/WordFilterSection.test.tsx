import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WordFilterSection } from "./WordFilterSection";

const listBannedWordsRequest = vi.fn();
const saveBannedWordsRequest = vi.fn();

vi.mock("@/services/word-filter/client", () => ({
  listBannedWordsRequest: (...args: unknown[]) =>
    listBannedWordsRequest(...args),
  saveBannedWordsRequest: (...args: unknown[]) =>
    saveBannedWordsRequest(...args),
}));

beforeEach(() => {
  vi.resetAllMocks();
  listBannedWordsRequest.mockResolvedValue({ ok: true, words: ["tonto"] });
});

function renderSection() {
  render(<WordFilterSection serverId="s1" titleId="title" />);
}

const input = () => screen.getByRole("textbox");
const save = () => screen.getByRole("button", { name: "Guardar cambios" });

describe("WordFilterSection", () => {
  it("muestra la lista guardada y no deja guardar sin cambios", async () => {
    renderSection();

    expect(await screen.findByText("tonto")).toBeInTheDocument();
    expect(listBannedWordsRequest).toHaveBeenCalledWith("s1");
    expect(save()).toBeDisabled();
  });

  it("CA2: agrega y quita palabras y guarda la lista entera", async () => {
    saveBannedWordsRequest.mockResolvedValue({
      ok: true,
      words: ["no sirve"],
    });
    renderSection();
    await screen.findByText("tonto");

    await userEvent.type(input(), "  NO   Sirve{enter}");
    await userEvent.click(
      screen.getByRole("button", { name: "Quitar «tonto»" }),
    );
    await userEvent.click(save());

    expect(saveBannedWordsRequest).toHaveBeenCalledWith("s1", ["no sirve"]);
    expect(await screen.findByText("Lista guardada.")).toBeInTheDocument();
    expect(save()).toBeDisabled();
  });

  it("no agrega una palabra repetida", async () => {
    renderSection();
    await screen.findByText("tonto");

    await userEvent.type(input(), "TONTO{enter}");

    expect(screen.getByText(/ya está en la lista/)).toBeInTheDocument();
    expect(save()).toBeDisabled();
  });

  it("si el back rechaza el guardado, muestra el motivo", async () => {
    saveBannedWordsRequest.mockResolvedValue({
      ok: false,
      message: "No tenés permiso para editar las palabras prohibidas.",
    });
    renderSection();
    await screen.findByText("tonto");

    await userEvent.type(input(), "feo{enter}");
    await userEvent.click(save());

    expect(
      await screen.findByText(/No tenés permiso para editar/),
    ).toBeInTheDocument();
  });

  it("si no puede cargar la lista, lo dice y no muestra el editor", async () => {
    listBannedWordsRequest.mockResolvedValue({
      ok: false,
      message: "No pudimos cargar las palabras prohibidas. Intentá de nuevo.",
    });
    renderSection();

    expect(
      await screen.findByText(/No pudimos cargar las palabras/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
