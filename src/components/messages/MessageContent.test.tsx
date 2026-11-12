import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MessageContent } from "./MessageContent";

describe("MessageContent", () => {
  it("dibuja negrita, cursiva, tachado y codigo", () => {
    const { container } = render(
      <MessageContent content="**fuerte** *suave* ~~viejo~~ `x = 1`" />,
    );
    expect(container.querySelector("strong")).toHaveTextContent("fuerte");
    expect(container.querySelector("em")).toHaveTextContent("suave");
    expect(container.querySelector("s")).toHaveTextContent("viejo");
    expect(container.querySelector("code")).toHaveTextContent("x = 1");
    expect(container).not.toHaveTextContent("**");
  });

  it("dibuja titulos, viñetas, citas y bloques de codigo", () => {
    const { container } = render(
      <MessageContent
        content={"# Aviso\n- uno\n- dos\n> cita\n```\nconst a = 1;\n```"}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Aviso" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      ["uno", "dos"],
    );
    expect(container.querySelector("blockquote")).toHaveTextContent("cita");
    expect(container.querySelector("pre")).toHaveTextContent("const a = 1;");
  });

  it("pega el sufijo al final del ultimo bloque", () => {
    render(
      <MessageContent
        content={"- uno\n- dos"}
        suffix={<span>(editado)</span>}
      />,
    );
    expect(screen.getAllByRole("listitem")[1]).toHaveTextContent(
      "dos(editado)",
    );
  });

  it("resalta el termino buscado dentro del formato", () => {
    const { container } = render(
      <MessageContent content="**hola mundo**" highlight="mundo" />,
    );
    expect(container.querySelector("strong mark")).toHaveTextContent("mundo");
  });

  it("los links se abren en otra pestaña", () => {
    render(
      <MessageContent content="mira https://a.com y [la guia](https://b.com/g)" />,
    );
    const plain = screen.getByRole("link", { name: "https://a.com" });
    expect(plain).toHaveAttribute("href", "https://a.com");
    expect(plain).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "la guia" })).toHaveAttribute(
      "href",
      "https://b.com/g",
    );
  });

  it("el spoiler queda tapado hasta que se lo toca", () => {
    const { container } = render(<MessageContent content="||sorpresa||" />);
    const spoiler = screen.getByRole("button", { name: /spoiler/i });
    expect(container.querySelector(".invisible")).toHaveTextContent("sorpresa");
    fireEvent.click(spoiler);
    expect(container.querySelector(".invisible")).toBeNull();
    expect(screen.getByText("sorpresa")).toBeVisible();
  });

  it("dibuja subrayado, texto chico y listas numeradas y anidadas", () => {
    const { container } = render(
      <MessageContent
        content={"__abajo__\n-# chiquito\n3. tres\n4. cuatro\n   - sub"}
      />,
    );
    expect(container.querySelector("u")).toHaveTextContent("abajo");
    expect(screen.getByText("chiquito")).toHaveClass("text-xs");
    const ordered = container.querySelector("ol");
    expect(ordered).toHaveAttribute("start", "3");
    expect(ordered?.querySelector("li ul li")).toHaveTextContent("sub");
  });

  it("el sufijo va en el ultimo item de una lista anidada", () => {
    render(
      <MessageContent
        content={"- uno\n  - dos"}
        suffix={<span>(editado)</span>}
      />,
    );
    expect(screen.getAllByRole("listitem")[1]).toHaveTextContent(
      "dos(editado)",
    );
  });

  it("colorea los bloques de codigo con lenguaje", async () => {
    const { container } = render(
      <MessageContent content={"```js\nconst a = 1;\n```"} />,
    );
    expect(await screen.findByText("const")).toHaveClass("text-syntax-keyword");
    expect(screen.getByText("1")).toHaveClass("text-syntax-number");
    expect(container.querySelector("pre")).toHaveTextContent("const a = 1;");
  });

  it("sin lenguaje o con uno desconocido el codigo va sin color", async () => {
    const { container } = render(
      <MessageContent content={"```\nconst a\n```\n```cobol\nconst b\n```"} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(container.querySelector("pre span")).toBeNull();
  });
});
