import { render, screen } from "@testing-library/react";
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
});
