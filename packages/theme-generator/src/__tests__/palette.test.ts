import { describe, expect, it } from "vitest";
import { convertRgbToOkhsl } from "../extractColorsFromImage";
import { getColorScore } from "../palette";

describe("getColorScore", () => {
  it("returns 0 when palettes are identical", () => {
    expect(
      getColorScore(convertRgbToOkhsl([0, 0, 0]), [
        convertRgbToOkhsl([0, 0, 0]),
      ]),
    ).toEqual(0);
  });

  it("considers hue", () => {
    const referenceColor = convertRgbToOkhsl([200, 100, 50]);
    const alteredReferenceColor = {
      ...referenceColor,
      h: 10,
    };

    expect(
      getColorScore(alteredReferenceColor, [referenceColor]),
    ).toBeGreaterThan(0);
  });

  it("hue wraps around correctly at 360 degrees", () => {
    const referenceColor = { ...convertRgbToOkhsl([200, 100, 50]), h: 10 };
    const farReferenceColor = {
      ...referenceColor,
      h: 50,
    };

    const closeReferenceColor = {
      ...referenceColor,
      h: 358,
    };
    const closeDistance = getColorScore(closeReferenceColor, [referenceColor]);
    const farDistance = getColorScore(farReferenceColor, [referenceColor]);

    expect(farDistance).toBeGreaterThan(closeDistance);
  });

  it("considers lightness", () => {
    const referenceColor = convertRgbToOkhsl([200, 100, 50]);
    const alteredReferenceColor = {
      ...referenceColor,
      l: 10,
    };

    expect(
      getColorScore(alteredReferenceColor, [referenceColor]),
    ).toBeGreaterThan(0);
  });

  it("considers saturation", () => {
    const referenceColor = convertRgbToOkhsl([200, 100, 50]);
    const alteredReferenceColor = {
      ...referenceColor,
      s: 10,
    };

    expect(
      getColorScore(alteredReferenceColor, [referenceColor]),
    ).toBeGreaterThan(0);
  });

  it.each([["h"], ["s"], ["l"]])("considers %s weights", (weightKey) => {
    const referenceColor = { ...convertRgbToOkhsl([200, 100, 50]), h: 10 };
    const farReferenceColor = {
      ...referenceColor,
      [weightKey]: 50,
    };

    const closeReferenceColor = {
      ...referenceColor,
      [weightKey]: 50,
    };
    const closeDistance = getColorScore(closeReferenceColor, [referenceColor]);
    const farDistance = getColorScore(farReferenceColor, [
      referenceColor,
      { [weightKey]: 2 },
    ]);

    expect(farDistance).toBeGreaterThan(closeDistance);
  });
});
