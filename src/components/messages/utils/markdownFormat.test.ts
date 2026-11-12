import { describe, expect, it } from "vitest";

import {
  applyTextEdits,
  type MarkdownFormat,
  toggleMarkdownFormat,
} from "./markdownFormat";

/** `[` y `]` marcan la seleccion en el texto de entrada y en el resultado. */
function toggle(marked: string, format: MarkdownFormat): string {
  const start = marked.indexOf("[");
  const end = marked.indexOf("]") - 1;
  const text = marked.replace("[", "").replace("]", "");
  const change = toggleMarkdownFormat(text, start, end, format);
  const result = applyTextEdits(text, change.edits);
  return (
    result.slice(0, change.selection.start) +
    "[" +
    result.slice(change.selection.start, change.selection.end) +
    "]" +
    result.slice(change.selection.end)
  );
}

describe("toggleMarkdownFormat", () => {
  it("envuelve la seleccion", () => {
    expect(toggle("di [hola] ya", "bold")).toBe("di **[hola]** ya");
    expect(toggle("[hola]", "italic")).toBe("*[hola]*");
    expect(toggle("[hola]", "strike")).toBe("~~[hola]~~");
    expect(toggle("[hola]", "code")).toBe("`[hola]`");
  });

  it("desenvuelve si los simbolos estan alrededor", () => {
    expect(toggle("di **[hola]** ya", "bold")).toBe("di [hola] ya");
  });

  it("desenvuelve si los simbolos estan seleccionados", () => {
    expect(toggle("[**hola**]", "bold")).toBe("[hola]");
  });

  it("la cursiva no se come un asterisco de la negrita", () => {
    expect(toggle("**[hola]**", "italic")).toBe("***[hola]***");
    expect(toggle("***[hola]***", "italic")).toBe("**[hola]**");
  });

  it("codigo de varios renglones va en bloque", () => {
    expect(toggle("[a\nb]", "code")).toBe("```\n[a\nb]\n```");
    expect(toggle("```\n[a\nb]\n```", "code")).toBe("[a\nb]");
  });

  it("cita cada renglon tocado y la saca si ya estaban todos", () => {
    expect(toggle("x\n[uno\ndos]\ny", "quote")).toBe("x\n> [uno\n> dos]\ny");
    expect(toggle("> [uno\n> dos]", "quote")).toBe("[uno\ndos]");
  });

  it("cita el renglon del cursor aunque no haya seleccion", () => {
    expect(toggle("ho[]la", "quote")).toBe("> ho[]la");
  });
});
