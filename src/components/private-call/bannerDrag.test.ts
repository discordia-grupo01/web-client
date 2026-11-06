import { describe, expect, it } from "vitest";

import { clampOffset, dragBoundsOf, exceedsDragThreshold } from "./bannerDrag";

const bounds = dragBoundsOf({
  banner: { x: 100, y: 12, width: 200, height: 40 },
  viewport: { width: 400, height: 800 },
  margin: 8,
});

describe("dragBoundsOf", () => {
  it("deja moverlo hasta los bordes de la ventana con margen", () => {
    expect(bounds).toEqual({ minX: -92, maxX: 92, minY: -4, maxY: 740 });
  });
});

describe("clampOffset", () => {
  it("deja pasar un movimiento dentro de la ventana", () => {
    expect(clampOffset({ x: 30, y: 200 }, bounds)).toEqual({ x: 30, y: 200 });
  });

  it("frena el banner en los bordes", () => {
    expect(clampOffset({ x: -500, y: 900 }, bounds)).toEqual({
      x: -92,
      y: 740,
    });
    expect(clampOffset({ x: 500, y: -900 }, bounds)).toEqual({
      x: 92,
      y: -4,
    });
  });

  it("si no entra de costado, lo deja donde esta en ese eje", () => {
    expect(
      clampOffset({ x: 10, y: 0 }, { minX: 4, maxX: -4, minY: 0, maxY: 10 }),
    ).toEqual({ x: 4, y: 0 });
  });
});

describe("exceedsDragThreshold", () => {
  it("un movimiento chico sigue siendo un click", () => {
    expect(exceedsDragThreshold({ x: 3, y: -4 }, 6)).toBe(false);
  });

  it("pasado el umbral en cualquier eje es arrastre", () => {
    expect(exceedsDragThreshold({ x: 0, y: -7 }, 6)).toBe(true);
  });
});
