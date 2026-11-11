import { describe, expect, it } from "vitest";

import { boostLevelErrorResponse } from "./error-payload";

describe("boostLevelErrorResponse", () => {
  it("un GIF sin nivel 1 marca el campo del ícono", () => {
    const response = boostLevelErrorResponse({
      status: 403,
      details: { reason: "boost_level_required", required_level: 1 },
    });

    expect(response).toEqual({
      status: 403,
      payload: {
        ok: false,
        message: "Este servidor necesita el nivel 1 de boosts para eso.",
        fieldErrors: {
          icon: "Este servidor necesita el nivel 1 de boosts para eso.",
        },
      },
    });
  });

  it("un banner sin nivel 2 marca el campo del banner", () => {
    const response = boostLevelErrorResponse({
      status: 403,
      details: { reason: "boost_level_required", required_level: 2 },
    });

    expect(response?.payload.fieldErrors).toEqual({
      banner: "Este servidor necesita el nivel 2 de boosts para eso.",
    });
  });

  it("un nivel sin campo en este formulario queda como error general", () => {
    const response = boostLevelErrorResponse({
      status: 403,
      details: { reason: "boost_level_required", required_level: 3 },
    });

    expect(response?.payload).toEqual({
      ok: false,
      message: "Este servidor necesita el nivel 3 de boosts para eso.",
    });
  });

  it("deja pasar el 403 de falta de permiso", () => {
    expect(boostLevelErrorResponse({ status: 403 })).toBeUndefined();
    expect(
      boostLevelErrorResponse({
        status: 403,
        details: { reason: "forbidden" },
      }),
    ).toBeUndefined();
  });
});
