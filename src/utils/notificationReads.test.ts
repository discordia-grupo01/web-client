import { afterEach, describe, expect, it, vi } from "vitest";

import {
  readNotificationReadMarks,
  writeNotificationReadMarks,
} from "@/utils/notificationReads";

const KEY = "discordia:notification-reads:u1";

describe("notificationReads", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("guarda y lee las marcas por usuario", () => {
    writeNotificationReadMarks("u1", {
      "channel:c1": "2026-11-02T12:00:00.000Z",
    });

    expect(readNotificationReadMarks("u1")).toEqual({
      "channel:c1": "2026-11-02T12:00:00.000Z",
    });
    expect(readNotificationReadMarks("u2")).toEqual({});
  });

  it("sin nada guardado no hay marcas", () => {
    expect(readNotificationReadMarks("u1")).toEqual({});
  });

  it("descarta lo que no es una fecha y conserva el resto", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        "channel:c1": "2026-11-02T12:00:00.000Z",
        "channel:c2": "basura",
        "channel:c3": 5,
      }),
    );

    expect(readNotificationReadMarks("u1")).toEqual({
      "channel:c1": "2026-11-02T12:00:00.000Z",
    });
  });

  it("un contenido que no es un objeto se ignora", () => {
    for (const raw of ["[]", "123", "null", "no es json"]) {
      localStorage.setItem(KEY, raw);
      expect(readNotificationReadMarks("u1")).toEqual({});
    }
  });

  it("sin storage no falla ni al leer ni al escribir", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });

    expect(readNotificationReadMarks("u1")).toEqual({});
    expect(() => writeNotificationReadMarks("u1", {})).not.toThrow();
  });
});
