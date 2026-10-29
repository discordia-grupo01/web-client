import { describe, expect, it } from "vitest";

import { readFileAsDataUrl } from "./readFileAsDataUrl";

describe("readFileAsDataUrl", () => {
  it("devuelve el contenido del archivo como data URL", async () => {
    const file = new File(["hola"], "saludo.txt", { type: "text/plain" });
    await expect(readFileAsDataUrl(file)).resolves.toBe(
      "data:text/plain;base64,aG9sYQ==",
    );
  });
});
