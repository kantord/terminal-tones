import { type Okhsl } from "culori";
import { convertRgbToOkhsl } from "./extractColorsFromImage";

export type Palette = Okhsl[];
type ReferenceColorWeights = {
  h?: number;
  s?: number;
  l?: number;
};
// type ReferencePaletteItem = [Okhsl, ReferencePaletteItemWeights] | [Okhsl]
// export type ReferencePalette = ReferencePaletteItem[]

// export const REFERENCE_PALETTE: ReferencePalette = [
//   [convertRgbToOkhsl([0, 0, 0]), { l: 2 }],
//   [convertRgbToOkhsl([128, 0, 0]), { h: 3, s: 2 }],
//   [convertRgbToOkhsl([0, 128, 0]), { h: 3, s: 2 }],
//   [convertRgbToOkhsl([128, 128, 0]), { h: 3, s: 2 }],
//   [convertRgbToOkhsl([0, 0, 128])],
//   [convertRgbToOkhsl([128, 0, 128])],
//   [convertRgbToOkhsl([0, 128, 128])],
//   [convertRgbToOkhsl([192, 192, 192])],
//
//   [convertRgbToOkhsl([128, 128, 128])],
//   [convertRgbToOkhsl([255, 0, 0]), { h: 3, s: 2 }],
//   [convertRgbToOkhsl([0, 255, 0]), { h: 3, s: 2 }],
//   [convertRgbToOkhsl([255, 255, 0]), { h: 3, s: 2 }],
//   [convertRgbToOkhsl([0, 0, 255])],
//   [convertRgbToOkhsl([255, 0, 255])],
//   [convertRgbToOkhsl([0, 255, 255])],
//   [convertRgbToOkhsl([255, 255, 255]), { l: 2 }],
// ];

export type ReferenceColor = [Okhsl, ReferenceColorWeights] | [Okhsl];

export function getColorScore(
  color: Okhsl,
  [reference, weights = {}]: ReferenceColor,
): number {
  const { h: hWeight = 1, l: lWeight = 1, s: sWeight = 1 } = weights;
  const lightnessScore = Math.abs(color.l - reference.l);
  const naiveHueDistance =
    reference.h !== undefined ? Math.abs(reference.h - (color.h ?? 255)) : 0;
  const hueScore = Math.min(naiveHueDistance, 360 - naiveHueDistance);
  const saturationScore =
    reference.s !== undefined ? Math.abs(reference.s - (color.s ?? 255)) : 0;

  return (
    lightnessScore * lWeight + hueScore * hWeight + saturationScore * sWeight
  );
}
