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
  [convertRgbToOkhsl([0, 0, 0]), { l: 2 }],   // 0 black
  [convertRgbToOkhsl([128, 0, 0]), { h: 3, s: 2 }],   // 1 red (maroon)
  [convertRgbToOkhsl([0, 128, 0]), { h: 3, s: 2 }],   // 2 green
  [convertRgbToOkhsl([128, 128, 0]), { h: 3, s: 2 }],   // 3 yellow (olive)
  [convertRgbToOkhsl([0, 0, 128])],   // 4 blue (navy)
  [convertRgbToOkhsl([128, 0, 128])],   // 5 magenta (purple)
  [convertRgbToOkhsl([0, 128, 128])],   // 6 cyan (teal)
  [convertRgbToOkhsl([192, 192, 192])],   // 7 white (light-grey)

  [convertRgbToOkhsl([128, 128, 128])],   // 8 bright-black (dark-grey)
  [convertRgbToOkhsl([255, 0, 0]), { h: 3, s: 2 }],   // 9 bright-red
  [convertRgbToOkhsl([0, 255, 0]), { h: 3, s: 2 }],   // 10 bright-green
  [convertRgbToOkhsl([255, 255, 0]), { h: 3, s: 2 }],   // 11 bright-yellow
  [convertRgbToOkhsl([0, 0, 255])],   // 12 bright-blue
  [convertRgbToOkhsl([255, 0, 255])],   // 13 bright-magenta
  [convertRgbToOkhsl([0, 255, 255])],   // 14 bright-cyan
  [convertRgbToOkhsl([255, 255, 255]), { l: 2 }],   // 15 bright-white
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
