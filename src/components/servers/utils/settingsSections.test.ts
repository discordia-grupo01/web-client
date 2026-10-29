import { describe, expect, it } from "vitest";

import { visibleSections } from "./settingsSections";

describe("visibleSections", () => {
  it("muestra las dos secciones con los dos permisos", () => {
    expect(
      visibleSections({ canManageServer: true, canManageMessages: true }),
    ).toEqual(["profile", "words"]);
  });

  it("muestra solo el perfil con MANAGE_SERVER", () => {
    expect(
      visibleSections({ canManageServer: true, canManageMessages: false }),
    ).toEqual(["profile"]);
  });

  it("muestra solo las palabras prohibidas con MANAGE_MESSAGES", () => {
    expect(
      visibleSections({ canManageServer: false, canManageMessages: true }),
    ).toEqual(["words"]);
  });
});
