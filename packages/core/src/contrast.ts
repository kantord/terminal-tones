import {
  BackgroundColor,
  Color,
  Theme,
  type CssColor,
} from "@adobe/leonardo-contrast-colors";
import { toOkhsl } from "./utils";
import type { GenerateOptions } from "./types";
import { equalizePaletteLightnessOKHSL } from "./equalize";

export function getContrastPalette(
  rawColors: CssColor[],
  options: GenerateOptions,
): Theme["contrastColors"] {
  // Normalize OKHSL lightness of all keys except background so
  // Leonardo builds ramps from harmonized inputs.
  const normalizedRawColors = equalizePaletteLightnessOKHSL(rawColors, 0);
  const {
    mode,
    lightnessMultiplier = 1,
    contrastMultiplier = 1,
    contrastLift = 0,
  } = options;
  // Build ratios with additive lift after scaling. Ensure minimum of 1.
  const ratios = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => {
    const v = r * (contrastMultiplier || 1) + (contrastLift || 0);
    return Math.max(1, v);
  });

  const background = new BackgroundColor({
    name: "background",
    colorKeys: [normalizedRawColors[0]],
    ratios,
  });

  const rawBackgroundLightness = toOkhsl(normalizedRawColors[0]).l;
  if (rawBackgroundLightness == null)
    throw new Error(
      "Failed to derive OKHSL lightness from terminal background",
    );
  if (rawBackgroundLightness < -1e-6 || rawBackgroundLightness > 1 + 1e-6)
    throw new Error(`OKHSL lightness out of [0,1]: ${rawBackgroundLightness}`);

  let backgroundLightness: number;
  if (mode === "dark") {
    const lCapped = Math.min(rawBackgroundLightness, 0.1);
    backgroundLightness = Math.min(
      Math.max(lCapped * (lightnessMultiplier || 1), 0),
      1,
    );
  } else {
    const delta = Math.min(1 - rawBackgroundLightness, 0.1);
    backgroundLightness = Math.min(
      Math.max(rawBackgroundLightness + delta * (lightnessMultiplier || 1), 0),
      1,
    );
  }
  const themeLightness = Math.round(backgroundLightness * 100);

  const colorPairs: Array<[[number, number], string]> = [
    [[1, 9], "red"],
    [[2, 10], "green"],
    [[3, 11], "yellow"],
    [[4, 12], "blue"],
    [[5, 13], "magenta"],
    [[6, 14], "cyan"],
  ];

  const simpleColors: Array<[number, string]> = [[16, "orange"]];

  const colors = [
    new Color({
      name: "neutral",
      colorKeys: [
        normalizedRawColors[0],
        normalizedRawColors[7],
        normalizedRawColors[8],
        normalizedRawColors[15],
      ],
      colorspace: "CAM02",
      ratios,
    }),
    ...colorPairs.map(
      ([[color1Index, color2Index], name]) =>
        new Color({
          name,
          colorKeys: [
            normalizedRawColors[color1Index],
            normalizedRawColors[color2Index],
          ],
          colorspace: "CAM02",
          ratios,
        }),
    ),
    ...simpleColors.map(
      ([colorIndex, name]) =>
        new Color({
          name,
          colorKeys: [normalizedRawColors[colorIndex]],
          colorspace: "CAM02",
          ratios,
        }),
    ),
  ];

  const { contrastColors } = new Theme({
    colors,
    backgroundColor: background,
    lightness: themeLightness,
  });

  return contrastColors;
}
