import { PRESET_BANNERS } from "@discordia/client-shared";
import { describe, expect, it } from "vitest";

import { presetBannerGradientCss } from "./preset-banner";

describe("presetBannerGradientCss", () => {
  it("arma el degradado con las mismas paradas que describe el preset", () => {
    expect(presetBannerGradientCss(PRESET_BANNERS[0])).toBe(
      "linear-gradient(135deg, #245C6B 0%, #1C293B 58%, #16202f 100%)",
    );
  });

  it("no filtra errores de coma flotante al CSS", () => {
    for (const preset of PRESET_BANNERS) {
      expect(presetBannerGradientCss(preset)).not.toContain("99999");
    }
  });
});
