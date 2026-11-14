import { describe, expect, it } from "vitest";

import { visibleSections } from "./settingsSections";

describe("visibleSections", () => {
  it("muestra las dos secciones con los dos permisos", () => {
    expect(
      visibleSections({
        canManageServer: true,
        canManageMessages: true,
        canReviewReports: false,
      }),
    ).toEqual(["profile", "words"]);
  });

  it("muestra solo el perfil con MANAGE_SERVER", () => {
    expect(
      visibleSections({
        canManageServer: true,
        canManageMessages: false,
        canReviewReports: false,
      }),
    ).toEqual(["profile"]);
  });

  it("muestra solo las palabras prohibidas con MANAGE_MESSAGES", () => {
    expect(
      visibleSections({
        canManageServer: false,
        canManageMessages: true,
        canReviewReports: false,
      }),
    ).toEqual(["words"]);
  });

  it("suma Reportes y el registro de auditoría al final para un moderador", () => {
    expect(
      visibleSections({
        canManageServer: false,
        canManageMessages: true,
        canReviewReports: true,
      }),
    ).toEqual(["words", "reports", "audit"]);
  });
});
