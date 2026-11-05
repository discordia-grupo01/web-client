import { describe, expect, it } from "vitest";

import { flattenReturnQuery } from "./returnQuery";

describe("flattenReturnQuery", () => {
  it("separa los parámetros que Mercado Pago agrega con un segundo ?", () => {
    expect(
      flattenReturnQuery({ kind: "premium?preapproval_id=1bcccd697ce2" }),
    ).toEqual({ kind: "premium", preapproval_id: "1bcccd697ce2" });
  });

  it("deja igual un query bien armado", () => {
    expect(
      flattenReturnQuery({
        kind: "points",
        result: "success",
        purchase_id: "p1",
      }),
    ).toEqual({ kind: "points", result: "success", purchase_id: "p1" });
  });

  it("no pisa un parámetro propio con uno agregado", () => {
    expect(
      flattenReturnQuery({
        kind: "points?purchase_id=otra",
        purchase_id: "p1",
      }),
    ).toEqual({ kind: "points", purchase_id: "p1" });
  });

  it("toma el primer valor si se repite y saltea los vacíos", () => {
    expect(
      flattenReturnQuery({ kind: ["premium", "points"], result: undefined }),
    ).toEqual({ kind: "premium" });
  });
});
