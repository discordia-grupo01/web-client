import { describe, expect, it } from "vitest";

import { initialSection, visibleSections } from "./settingsSections";

describe("visibleSections", () => {
  it("muestra el perfil, los boosts y las palabras con los dos permisos", () => {
    expect(
      visibleSections({
        canManageServer: true,
        canManageMessages: true,
        canReviewReports: false,
      }),
    ).toEqual(["profile", "boosts", "words"]);
  });

  it("muestra el perfil y los boosts con MANAGE_SERVER", () => {
    expect(
      visibleSections({
        canManageServer: true,
        canManageMessages: false,
        canReviewReports: false,
      }),
    ).toEqual(["profile", "boosts"]);
  });

  it("muestra los boosts y las palabras prohibidas con MANAGE_MESSAGES", () => {
    expect(
      visibleSections({
        canManageServer: false,
        canManageMessages: true,
        canReviewReports: false,
      }),
    ).toEqual(["boosts", "words"]);
  });

  it("suma Reportes y el registro de auditoría al final para un moderador", () => {
    expect(
      visibleSections({
        canManageServer: false,
        canManageMessages: true,
        canReviewReports: true,
      }),
    ).toEqual(["boosts", "words", "reports", "audit"]);
  });

  it("a un miembro sin permisos le muestra solo los boosts", () => {
    expect(
      visibleSections({
        canManageServer: false,
        canManageMessages: false,
        canReviewReports: false,
      }),
    ).toEqual(["boosts"]);
  });
});

describe("initialSection", () => {
  const all = ["profile", "boosts", "words", "reports", "audit"] as const;

  it("abre en la sección pedida", () => {
    expect(
      initialSection([...all], {
        requested: "boosts",
        hasPendingReports: true,
      }),
    ).toBe("boosts");
  });

  it("abre en reportes si hay pendientes y no se pidió otra", () => {
    expect(initialSection([...all], { hasPendingReports: true })).toBe(
      "reports",
    );
  });

  it("si no, abre en la primera sección que se gestiona", () => {
    expect(initialSection([...all], { hasPendingReports: false })).toBe(
      "profile",
    );
    expect(
      initialSection(["boosts", "words"], { hasPendingReports: false }),
    ).toBe("words");
    expect(initialSection(["boosts"], { hasPendingReports: false })).toBe(
      "boosts",
    );
  });

  it("ignora una sección pedida que no se ve", () => {
    expect(
      initialSection(["boosts"], {
        requested: "reports",
        hasPendingReports: false,
      }),
    ).toBe("boosts");
  });
});
