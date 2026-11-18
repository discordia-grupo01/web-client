import { describe, expect, it } from "vitest";

import { initialSection, visibleSections } from "./settingsSections";

describe("visibleSections", () => {
  it("muestra perfil, boosts, emojis y palabras con los dos permisos", () => {
    expect(
      visibleSections({
        canManageServer: true,
        canManageMessages: true,
        canReviewReports: false,
      }),
    ).toEqual(["profile", "boosts", "emojis", "words"]);
  });

  it("muestra el perfil y los boosts con MANAGE_SERVER", () => {
    expect(
      visibleSections({
        canManageServer: true,
        canManageMessages: false,
        canReviewReports: false,
      }),
    ).toEqual(["profile", "boosts", "emojis"]);
  });

  it("muestra los boosts y las palabras prohibidas con MANAGE_MESSAGES", () => {
    expect(
      visibleSections({
        canManageServer: false,
        canManageMessages: true,
        canReviewReports: false,
      }),
    ).toEqual(["boosts", "emojis", "words"]);
  });

  it("muestra roles con canManageRoles", () => {
    expect(
      visibleSections({
        canManageServer: false,
        canManageMessages: false,
        canManageRoles: true,
        canBanMembers: false,
        canReviewReports: false,
      }),
    ).toEqual(["boosts", "emojis", "roles"]);
  });

  it("muestra baneos con canBanMembers", () => {
    expect(
      visibleSections({
        canManageServer: false,
        canManageMessages: false,
        canManageRoles: false,
        canBanMembers: true,
        canReviewReports: false,
      }),
    ).toEqual(["boosts", "emojis", "bans"]);
  });

  it("muestra todas las secciones en el orden correcto", () => {
    expect(
      visibleSections({
        canManageServer: true,
        canManageMessages: true,
        canManageRoles: true,
        canBanMembers: true,
        canReviewReports: true,
      }),
    ).toEqual([
      "profile",
      "boosts",
      "emojis",
      "roles",
      "bans",
      "words",
      "reports",
      "audit",
    ]);
  });

  it("suma Reportes y el registro de auditoría al final para un moderador", () => {
    expect(
      visibleSections({
        canManageServer: false,
        canManageMessages: true,
        canReviewReports: true,
      }),
    ).toEqual(["boosts", "emojis", "words", "reports", "audit"]);
  });

  it("a un miembro sin permisos le muestra los boosts y los emojis", () => {
    expect(
      visibleSections({
        canManageServer: false,
        canManageMessages: false,
        canReviewReports: false,
      }),
    ).toEqual(["boosts", "emojis"]);
  });
});

describe("initialSection", () => {
  const all = [
    "profile",
    "boosts",
    "emojis",
    "roles",
    "bans",
    "words",
    "reports",
    "audit",
  ] as const;

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
      initialSection(["boosts", "emojis", "roles"], {
        hasPendingReports: false,
      }),
    ).toBe("roles");
    expect(
      initialSection(["boosts", "emojis", "bans"], {
        hasPendingReports: false,
      }),
    ).toBe("bans");
    expect(
      initialSection(["boosts", "emojis", "words"], {
        hasPendingReports: false,
      }),
    ).toBe("words");
    expect(
      initialSection(["boosts", "emojis"], { hasPendingReports: false }),
    ).toBe("boosts");
  });

  it("ignora una sección pedida que no se ve", () => {
    expect(
      initialSection(["boosts", "emojis"], {
        requested: "reports",
        hasPendingReports: false,
      }),
    ).toBe("boosts");
  });
});
