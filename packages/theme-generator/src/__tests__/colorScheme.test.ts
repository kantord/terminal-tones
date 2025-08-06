import { describe, expect, it } from "vitest";
import type { Okhsl } from "culori";
import getBestColorScheme from "../colorScheme";
import { convertRgbToOkhsl } from "../extractColorsFromImage";
import { ref } from "../types";

const black = convertRgbToOkhsl([0, 0, 0]);
const white = convertRgbToOkhsl([255, 255, 255]);
const red = convertRgbToOkhsl([255, 0, 0]);
const green = convertRgbToOkhsl([0, 255, 0]);
const blue = convertRgbToOkhsl([0, 0, 255]);

describe("getBestColorScheme", () => {
  it("throws when there are fewer candidates than slots", () => {
    expect(() =>
      getBestColorScheme([black], [ref(black), ref(white)]),
    ).toThrow();
  });

  it("returns exactly as many colours as reference slots", () => {
    const out = getBestColorScheme(
      [black, white, red],
      [ref(black), ref(white)],
    );
    expect(out).toHaveLength(2);
  });

  it("picks perfect matches when they exist", () => {
    const out = getBestColorScheme(
      [black, white, red],
      [ref(white), ref(black)],
    );
    expect(out).toEqual([white, black]);
  });

  it("chooses the closest colour when exact match is missing", () => {
    const nearBlack = convertRgbToOkhsl([12, 12, 12]);
    const out = getBestColorScheme([white, nearBlack], [ref(black)]);
    expect(out[0]).toEqual(nearBlack);
  });

  it("never re-uses the same candidate colour", () => {
    const out = getBestColorScheme(
      [black, red, green, blue],
      [ref(black), ref(red), ref(green)],
    );
    const unique = new Set(out);
    expect(unique.size).toBe(out.length);
  });

  it("works with a rectangular matrix (16 slots, 24 candidates)", () => {
    const slots = Array.from({ length: 16 }, (_, i) =>
      ref(convertRgbToOkhsl([i * 15, i * 10, i * 5])),
    );
    const candidates = Array.from({ length: 24 }, (_, i) =>
      convertRgbToOkhsl([i * 10, i * 5, i * 3]),
    );
    const out = getBestColorScheme(candidates, slots);
    expect(out).toHaveLength(16);
  });
});
