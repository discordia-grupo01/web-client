import { describe, expect, it } from "vitest";

import { avatarSrcOf, displayNameOf } from "@/utils/userProfile";

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
    expect(avatarSrcOf("u1", { name: "Nova", avatar_url: "x" })).toMatch(
      /^\/api\/users\/u1\/avatar\?v=[0-9a-z]+$/,
    );
  });

  it("cambia la URL cuando cambia la foto, para no mostrar la vieja cacheada", () => {
    const before = avatarSrcOf("u1", {
      name: "Nova",
      avatar_url: "https://cdn/u1.png?v=1",
    });
    const after = avatarSrcOf("u1", {
      name: "Nova",
      avatar_url: "https://cdn/u1.png?v=2",
    });
    expect(before).not.toBe(after);
    expect(
      avatarSrcOf("u1", { name: "Nova", avatar_url: "https://cdn/u1.png?v=1" }),
    ).toBe(before);
  });

  it("sin foto o sin perfil devuelve null", () => {
    expect(avatarSrcOf("u1", { name: "Nova", avatar_url: "" })).toBeNull();
    expect(avatarSrcOf("u1", null)).toBeNull();
  });
});
