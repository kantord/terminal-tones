import { describe, it, expect } from "vitest";
import { convertRgbToOkhsl } from "../extractColorsFromImage";
import getBestColorScheme, { REFERENCE_PALETTE_DARK, REFERENCE_PALETTE_LIGHT } from "../colorScheme";
import { customizeColorScheme } from "../optimizeColorscheme";

describe("optimizeColorscheme black/white point mapping", () => {
  it("maps darkest reference to black point and brightest to white point (dark)", () => {
    const candidates = Array.from({ length: 24 }, (_, i) => convertRgbToOkhsl([i, i, i]));
    const base16 = getBestColorScheme(candidates, REFERENCE_PALETTE_DARK);
    const blackPoint = 0.1;
    const whitePoint = 0.9;
    const optimized = customizeColorScheme(base16, REFERENCE_PALETTE_DARK, {
      blackPointLightness: blackPoint,
      whitePointLightness: whitePoint,
    });
    const refLs = REFERENCE_PALETTE_DARK.map(([c]) => c.l ?? 0);
    const minIdx = refLs.indexOf(Math.min(...refLs));
    const maxIdx = refLs.indexOf(Math.max(...refLs));
    expect(optimized[minIdx].l).toBeGreaterThanOrEqual(0.09);
    expect(optimized[minIdx].l).toBeLessThanOrEqual(0.11);
    expect(optimized[maxIdx].l).toBeGreaterThanOrEqual(0.89);
    expect(optimized[maxIdx].l).toBeLessThanOrEqual(0.91);
  });

  it("maps darkest reference to black point and brightest to white point (light)", () => {
    const candidates = Array.from({ length: 24 }, (_, i) => convertRgbToOkhsl([i, i, i]));
    const base16 = getBestColorScheme(candidates, REFERENCE_PALETTE_LIGHT);
    const blackPoint = 0.1;
    const whitePoint = 0.9;
    const optimized = customizeColorScheme(base16, REFERENCE_PALETTE_LIGHT, {
      blackPointLightness: blackPoint,
      whitePointLightness: whitePoint,
    });
    const refLs = REFERENCE_PALETTE_LIGHT.map(([c]) => c.l ?? 0);
    const minIdx = refLs.indexOf(Math.min(...refLs));
    const maxIdx = refLs.indexOf(Math.max(...refLs));
    expect(optimized[minIdx].l).toBeGreaterThanOrEqual(0.09);
    expect(optimized[minIdx].l).toBeLessThanOrEqual(0.11);
    expect(optimized[maxIdx].l).toBeGreaterThanOrEqual(0.89);
    expect(optimized[maxIdx].l).toBeLessThanOrEqual(0.91);
  });
});
