import { describe, expect, it } from "vitest";

import { hasErrors, validateLogin } from "./validation";

describe("validateLogin", () => {
  it("no devuelve errores con credenciales validas", () => {
    const errors = validateLogin({
      email: "ada@example.com",
      password: "secret",
    });
    expect(hasErrors(errors)).toBe(false);
  });

  it("acepta email con espacios alrededor", () => {
    const errors = validateLogin({
      email: "  ada@example.com  ",
      password: "secret",
    });
    expect(errors.email).toBeUndefined();
  });

  it("marca email con formato invalido", () => {
    const errors = validateLogin({ email: "no-es-email", password: "x" });
    expect(errors.email).toBe("El correo electronico no es valido");
  });

  it("marca email y password vacios", () => {
    const errors = validateLogin({ email: "", password: "" });
    expect(errors.email).toBe("Ingresa tu correo electronico");
    expect(errors.password).toBe("Ingresa tu contrasena");
    expect(hasErrors(errors)).toBe(true);
  });
});
