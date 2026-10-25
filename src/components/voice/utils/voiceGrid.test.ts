import { describe, expect, it } from "vitest";

import {
  NARROW_GRID,
  pickVisibleParticipants,
  stripCapacity,
  voiceFocusLayout,
  voiceGridLayout,
  WIDE_GRID,
} from "@/components/voice/utils/voiceGrid";

describe("voiceGridLayout", () => {
  it("con una persona usa un solo tile grande", () => {
    const layout = voiceGridLayout(1200, 700, 1, WIDE_GRID);

    expect(layout.columns).toBe(1);
    expect(layout.capacity).toBe(1);
    expect(layout.tileWidth).toBeCloseTo(1200);
  });

  it("con cuatro arma 2x2 y con nueve 3x3 en una pantalla ancha", () => {
    expect(voiceGridLayout(1200, 700, 4, WIDE_GRID).columns).toBe(2);
    expect(voiceGridLayout(1200, 700, 9, WIDE_GRID).columns).toBe(3);
  });

  it("achica los tiles para que entren todos sin scroll", () => {
    const layout = voiceGridLayout(1200, 700, 14, WIDE_GRID);

    expect(layout.capacity).toBe(14);
    const rows = Math.ceil(14 / layout.columns);
    const usedHeight = rows * layout.tileHeight + (rows - 1) * WIDE_GRID.gap;
    expect(usedHeight).toBeLessThanOrEqual(700);
    expect(layout.tileWidth).toBeGreaterThanOrEqual(WIDE_GRID.minTileWidth);
  });

  it("si no entran ni con el tile minimo, limita la capacidad", () => {
    const layout = voiceGridLayout(800, 450, 40, WIDE_GRID);

    expect(layout.capacity).toBeLessThan(40);
    expect(layout.tileWidth).toBeGreaterThanOrEqual(WIDE_GRID.minTileWidth);
    const rows = Math.ceil(layout.capacity / layout.columns);
    expect(
      rows * layout.tileHeight + (rows - 1) * WIDE_GRID.gap,
    ).toBeLessThanOrEqual(450);
  });

  it("en celular no pasa de tres columnas", () => {
    expect(voiceGridLayout(380, 560, 25, NARROW_GRID).columns).toBe(3);
  });

  it("sin medidas todavia no rompe", () => {
    expect(voiceGridLayout(0, 0, 5, WIDE_GRID).tileWidth).toBe(0);
  });
});

describe("stripCapacity", () => {
  it("cuenta cuantos tiles entran en la tira", () => {
    expect(stripCapacity(500, 120, 8)).toBe(3);
    expect(stripCapacity(50, 120, 8)).toBe(1);
  });
});

const person = (
  identity: string,
  overrides: Partial<{
    isLocal: boolean;
    speaking: boolean;
    cameraOn: boolean;
    screenSharing: boolean;
  }> = {},
) => ({
  identity,
  isLocal: false,
  speaking: false,
  cameraOn: false,
  screenSharing: false,
  ...overrides,
});

const ids = (list: { identity: string }[]) => list.map((p) => p.identity);

describe("pickVisibleParticipants", () => {
  const me = person("yo", { isLocal: true });

  it("si entran todos, los muestra a todos", () => {
    const all = [me, person("a"), person("b")];

    expect(pickVisibleParticipants(all, 5, [], new Map())).toEqual(all);
  });

  it("siempre te incluye y prioriza camara para llenar huecos", () => {
    const all = [person("a"), person("b"), person("c", { cameraOn: true }), me];

    expect(ids(pickVisibleParticipants(all, 2, [], new Map()))).toEqual([
      "c",
      "yo",
    ]);
  });

  it("mantiene a los que ya se veian", () => {
    const all = [me, person("a"), person("b"), person("c")];

    expect(
      ids(pickVisibleParticipants(all, 2, ["yo", "c"], new Map())),
    ).toEqual(["yo", "c"]);
  });

  it("quien empieza a hablar entra en lugar de quien hace mas que no habla", () => {
    const all = [me, person("a"), person("b"), person("c", { speaking: true })];
    const spokeAt = new Map([
      ["a", 5],
      ["b", 1],
    ]);

    expect(
      ids(pickVisibleParticipants(all, 3, ["yo", "a", "b"], spokeAt)),
    ).toEqual(["yo", "a", "c"]);
  });

  it("no saca a quien comparte pantalla", () => {
    const all = [
      me,
      person("a", { screenSharing: true }),
      person("b", { speaking: true }),
    ];

    expect(
      ids(pickVisibleParticipants(all, 2, ["yo", "a"], new Map())),
    ).toEqual(["yo", "a"]);
  });
});

describe("voiceFocusLayout", () => {
  it("en pantallas anchas pone al resto en una tira al costado", () => {
    const layout = voiceFocusLayout(1300, 600, 13, false);

    expect(layout.mode).toBe("side");
    expect(layout.stageWidth + layout.tileWidth).toBeLessThanOrEqual(1300);
  });

  it("en celular el resto usa el alto que queda, con tiles grandes", () => {
    const layout = voiceFocusLayout(374, 560, 1, true);

    expect(layout.mode).toBe("stacked");
    expect(layout.stageHeight).toBeLessThanOrEqual(560 * 0.55);
    expect(layout.tileWidth).toBe(Math.floor((374 - 8) / 2));
  });

  it("en celular con mucha gente limita la capacidad sin pasarse del alto", () => {
    const layout = voiceFocusLayout(374, 560, 30, true);
    const rows = Math.ceil(layout.capacity / layout.columns);

    expect(layout.capacity).toBeLessThan(30);
    expect(
      layout.stageHeight + 8 + rows * layout.tileHeight + (rows - 1) * 8,
    ).toBeLessThanOrEqual(560);
  });
});
