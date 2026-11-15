import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  onSettingsSectionOpened,
  openSettingsSection,
  requestSettingsSection,
  takeRequestedSettingsSection,
} from "./settingsRequest";

beforeEach(() => {
  sessionStorage.clear();
});

describe("settingsRequest", () => {
  it("devuelve la sección pedida una sola vez", () => {
    requestSettingsSection("subscriptions");

    expect(takeRequestedSettingsSection()).toBe("subscriptions");
    expect(takeRequestedSettingsSection()).toBeNull();
  });

  it("ignora valores que no son secciones", () => {
    sessionStorage.setItem("discordia:open-settings", "otra");

    expect(takeRequestedSettingsSection()).toBeNull();
  });

  it("avisa al instante qué sección abrir", () => {
    const listener = vi.fn();
    const stop = onSettingsSectionOpened(listener);

    openSettingsSection("points");
    stop();
    openSettingsSection("boosts");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("points");
  });
});
