import { beforeEach, describe, expect, it } from "vitest";

import {
  requestSettingsSection,
  takeRequestedSettingsSection,
} from "./settingsRequest";

beforeEach(() => {
  sessionStorage.clear();
});

describe("settingsRequest", () => {
  it("devuelve la sección pedida una sola vez", () => {
    requestSettingsSection("billing");

    expect(takeRequestedSettingsSection()).toBe("billing");
    expect(takeRequestedSettingsSection()).toBeNull();
  });

  it("ignora valores que no son secciones", () => {
    sessionStorage.setItem("discordia:open-settings", "otra");

    expect(takeRequestedSettingsSection()).toBeNull();
  });
});
