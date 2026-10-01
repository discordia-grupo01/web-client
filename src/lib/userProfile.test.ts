import { describe, expect, it } from "vitest";

import { avatarSrcOf, displayNameOf } from "./userProfile";

describe("displayNameOf", () => {
  it("usa el nombre del perfil", () => {
    expect(displayNameOf({ name: "Nova", avatar_url: "" })).toBe("Nova");
  });

  it("sin perfil replicado dice 'Usuario desconocido'", () => {
    expect(displayNameOf(null)).toBe("Usuario desconocido");
    expect(displayNameOf(undefined)).toBe("Usuario desconocido");
  });
});

describe("avatarSrcOf", () => {
  it("apunta a la foto del usuario si tiene", () => {
    expect(avatarSrcOf("u1", { name: "Nova", avatar_url: "x" })).toBe(
      "/api/users/u1/avatar",
    );
  });

  it("sin foto o sin perfil devuelve null", () => {
    expect(avatarSrcOf("u1", { name: "Nova", avatar_url: "" })).toBeNull();
    expect(avatarSrcOf("u1", null)).toBeNull();
  });
});
