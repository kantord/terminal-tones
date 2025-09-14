import { describe, it, expect } from "vitest";
import { fuzzyPaletteWeightsOKLab } from "../semantic";

describe("fuzzyPaletteWeightsOKLab", () => {
  it("normalizes weights to sum to 1", () => {
    const pal = ["#000000", "#ffffff"];
    const pixels: Array<[number, number, number]> = [
      [0, 0, 0],
      [255, 255, 255],
    ];
    const w = fuzzyPaletteWeightsOKLab(pal, pixels);
    const sum = w.reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1)).toBeLessThan(1e-6);
  });

  it("assigns higher weight to closer palette color", () => {
    const pal = ["#000000", "#ffffff"];
    const pixels: Array<[number, number, number]> = Array.from(
      { length: 100 },
      () => [10, 10, 10],
    );
    const w = fuzzyPaletteWeightsOKLab(pal, pixels, { sigma: 0.06 });
    expect(w[0]).toBeGreaterThan(w[1]);
  });

  it("reflects pixel mix proportions approximately", () => {
    const pal = ["#000000", "#ffffff"];
    const darkPixels: Array<[number, number, number]> = Array.from(
      { length: 300 },
      () => [0, 0, 0],
    );
    const lightPixels: Array<[number, number, number]> = Array.from(
      { length: 100 },
      () => [255, 255, 255],
    );
    const pixels = darkPixels.concat(lightPixels);
    const w = fuzzyPaletteWeightsOKLab(pal, pixels, {
      sigma: 0.06,
      ignoreNearWhite: false,
    });
    expect(w[0]).toBeGreaterThan(w[1]);
  });

  it("ignores transparent and near-white pixels when configured", () => {
    const pal = ["#000000", "#ffffff"];
    const opaqueDark: Array<[number, number, number, number]> = Array.from(
      { length: 50 },
      () => [20, 20, 20, 255],
    );
    const transparent: Array<[number, number, number, number]> = Array.from(
      { length: 100 },
      () => [20, 20, 20, 10],
    );
    const nearWhite: Array<[number, number, number, number]> = Array.from(
      { length: 100 },
      () => [251, 251, 251, 255],
    );
    const pixels = opaqueDark.concat(transparent, nearWhite);
    const w = fuzzyPaletteWeightsOKLab(pal, pixels, {
      alphaThreshold: 128,
      ignoreNearWhite: true,
    });
    expect(w[0]).toBeGreaterThan(w[1]);
  });
});
