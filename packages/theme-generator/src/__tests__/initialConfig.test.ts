import { describe, it, expect } from "vitest";
import { convertRgbToOkhsl } from "../extractColorsFromImage";
import { REFERENCE_PALETTE_DARK, REFERENCE_PALETTE_LIGHT } from "../colorScheme";
import { deriveInitialCustomization } from "../initialConfig";

describe("deriveInitialCustomization", () => {
  it("derives endpoints for dark reference", () => {
    const base = [
      convertRgbToOkhsl([0, 0, 0]), // background
      ...Array.from({ length: 14 }, () => convertRgbToOkhsl([128, 128, 128])),
      convertRgbToOkhsl([255, 255, 255]), // foreground
    ];
    const { blackPointLightness, whitePointLightness, dynamicRange } = deriveInitialCustomization(
      base,
      REFERENCE_PALETTE_DARK,
    );
    expect(blackPointLightness).toBeLessThan(whitePointLightness);
    expect(dynamicRange).toBeCloseTo(whitePointLightness - blackPointLightness, 5);
  });

  it("derives endpoints for light reference", () => {
    const base = [
      convertRgbToOkhsl([255, 255, 255]), // background (light)
      ...Array.from({ length: 14 }, () => convertRgbToOkhsl([200, 200, 200])),
      convertRgbToOkhsl([0, 0, 0]), // foreground (dark)
    ];
    const { blackPointLightness, whitePointLightness, dynamicRange } = deriveInitialCustomization(
      base,
      REFERENCE_PALETTE_LIGHT,
    );
    expect(blackPointLightness).toBeLessThan(whitePointLightness);
    expect(dynamicRange).toBeCloseTo(whitePointLightness - blackPointLightness, 5);
  });
});
