import { describe, expect, it } from "vitest";

import { hasErrors, validateLogin, validateRegister } from "./validation";

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

describe("validateRegister", () => {
  const valid = {
    name: "ada",
    email: "ada@example.com",
    password: "Secret123",
  };

  it("no devuelve errores con datos validos", () => {
    expect(hasErrors(validateRegister(valid))).toBe(false);
  });

  it("marca nombre vacio y corto", () => {
    expect(validateRegister({ ...valid, name: "" }).name).toBe(
      "Ingresa un nombre de usuario",
    );
    expect(validateRegister({ ...valid, name: "ab" }).name).toMatch(
      /al menos 3/,
    );
  });

  it("marca email con formato invalido", () => {
    expect(validateRegister({ ...valid, email: "no-es-email" }).email).toBe(
      "El correo electronico no es valido",
    );
  });

  it("exige contrasena con mayuscula, minuscula y numero", () => {
    expect(
      validateRegister({ ...valid, password: "corta" }).password,
    ).toBeDefined();
    expect(
      validateRegister({ ...valid, password: "todominuscula1" }).password,
    ).toBeDefined();
    expect(
      validateRegister({ ...valid, password: "SinNumeros" }).password,
    ).toBeDefined();
    expect(
      validateRegister({ ...valid, password: "Valida123" }).password,
    ).toBeUndefined();
  });
});
