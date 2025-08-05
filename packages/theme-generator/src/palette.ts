import { type Okhsl } from "culori"
import { convertRgbToOkhsl } from "./extractColorsFromImage"
import { sumBy, zip } from "es-toolkit";

export type Palette = Okhsl[]
type ReferencePaletteItemWeights = {
  h?: number,
  s?: number,
  l?: number,
}
type ReferencePaletteItem = [Okhsl, ReferencePaletteItemWeights] | [Okhsl]
export type ReferencePalette = ReferencePaletteItem[]

export const REFERENCE_PALETTE: ReferencePalette = [
  [convertRgbToOkhsl([0, 0, 0]), { l: 2 }],
  [convertRgbToOkhsl([128, 0, 0]), { h: 3, s: 2 }],
  [convertRgbToOkhsl([0, 128, 0]), { h: 3, s: 2 }],
  [convertRgbToOkhsl([128, 128, 0]), { h: 3, s: 2 }],
  [convertRgbToOkhsl([0, 0, 128])],
  [convertRgbToOkhsl([128, 0, 128])],
  [convertRgbToOkhsl([0, 128, 128])],
  [convertRgbToOkhsl([192, 192, 192])],

  [convertRgbToOkhsl([128, 128, 128])],
  [convertRgbToOkhsl([255, 0, 0]), { h: 3, s: 2 }],
  [convertRgbToOkhsl([0, 255, 0]), { h: 3, s: 2 }],
  [convertRgbToOkhsl([255, 255, 0]), { h: 3, s: 2 }],
  [convertRgbToOkhsl([0, 0, 255])],
  [convertRgbToOkhsl([255, 0, 255])],
  [convertRgbToOkhsl([0, 255, 255])],
  [convertRgbToOkhsl([255, 255, 255]), { l: 2 }],
];

export function getPaletteScore(palette: Palette, referencePalette: ReferencePalette): number {
  if (palette.length !== referencePalette.length) {
    throw new Error('Palette size does not match reference palette')
  }


  return sumBy(zip(palette, referencePalette), ([color, referenceItem]) => {
    const [reference, weights = {}] = referenceItem
    const hWeight = weights.h ?? 1
    const lWeight = weights.l ?? 1
    const sWeight = weights.s ?? 1

    const lightnessScore = Math.abs(color.l - reference.l)
    const hueScore = reference.h !== undefined ?
      Math.abs(reference.h - (color.h ?? 255)) : 0
    const saturationScore = reference.s !== undefined ?
      Math.abs(reference.s - (color.s ?? 255)) : 0

    return lightnessScore * lWeight + hueScore * hWeight + saturationScore * sWeight
  })
}
