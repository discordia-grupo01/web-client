import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MessageEditor } from "./MessageEditor";

function renderEditor(
  value: string,
  segments: Parameters<typeof MessageEditor>[0]["segments"] = null,
) {
  const props = {
    segments,
    onChange: vi.fn(),
    onCursorMove: vi.fn(),
    placeholder: "Mensaje en #general",
  };
  const view = render(<MessageEditor value={value} {...props} />);
  return {
    ...view,
    rerenderWith: (next: string) =>
      view.rerender(<MessageEditor value={next} {...props} />),
  };
}

/** El pedazo de texto que dibuja Slate con ese contenido exacto. */
function leaf(text: string): HTMLElement {
  const string = screen
    .getAllByText(text)
    .find((element) => element.hasAttribute("data-slate-string"));
  if (!string) throw new Error(`No hay un pedazo con "${text}"`);
  return string.closest("[data-slate-leaf]") as HTMLElement;
}

describe("MessageEditor", () => {
  it("pinta el formato y deja los simbolos a la vista, atenuados", () => {
    renderEditor("di **hola** y ~~chau~~");

    expect(leaf("hola")).toHaveClass("font-bold");
    expect(leaf("chau")).toHaveClass("line-through");
    expect(leaf("~~")).toHaveClass("text-content-subtle");
    expect(screen.getByRole("textbox")).toHaveTextContent(
      "di **hola** y ~~chau~~",
    );
  });

  it("titulos y codigo en su renglon", () => {
    renderEditor("# Aviso\nusa `npm`");

    expect(leaf("Aviso")).toHaveClass("text-xl");
    expect(leaf("npm")).toHaveClass("font-mono");
  });

  it("resalta las menciones elegidas", () => {
    renderEditor("hola @Beto", [
      { kind: "text", value: "hola " },
      { kind: "user", value: "@Beto", id: "u_beto" },
    ]);

    expect(leaf("@Beto").getAttribute("style")).toContain("background-color");
  });

  it("muestra el texto nuevo cuando el borrador cambia desde afuera", async () => {
    const { rerenderWith } = renderEditor("hola");

    rerenderWith("hola 😀");
    expect(screen.getByRole("textbox")).toHaveTextContent("hola 😀");

    rerenderWith("");
    expect(await screen.findByText("Mensaje en #general")).toBeInTheDocument();
  });
});
