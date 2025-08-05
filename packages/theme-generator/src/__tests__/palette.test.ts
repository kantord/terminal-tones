import { describe, it, expect } from "vitest";
import { getPaletteScore, Palette, REFERENCE_PALETTE, ReferencePalette } from "../palette";
import { convertRgbToOkhsl } from "../extractColorsFromImage";

function extractColors(referencePalette: ReferencePalette): Palette {
  return referencePalette.map(([color,]) => color)
}

const REFERENCE_PALETTE_COLORS = extractColors(REFERENCE_PALETTE)
const REFERENCE_PALETTE_WITHOUT_WEIGHTS: ReferencePalette = REFERENCE_PALETTE.map(([item,]) => ([item]))

describe('getPaletteScore', () => {
  it('throws when the palette size does not match the reference palette', () => {
    expect(() => getPaletteScore([], REFERENCE_PALETTE)).toThrow()
  })

  it('returns 0 when palettes are empty', () => {
    expect(getPaletteScore([], [])).toEqual(0)
  })

  it('returns 0 when palettes are identical', () => {
    expect(getPaletteScore(extractColors(REFERENCE_PALETTE), REFERENCE_PALETTE)).toEqual(0)
  })

  it('returns a larger value when palette is not a perfect match', () => {
    const palette = [...REFERENCE_PALETTE_COLORS]
    palette[1] = convertRgbToOkhsl([0, 0, 0])

    expect(getPaletteScore(palette, REFERENCE_PALETTE)).toBeGreaterThan(0)
  })

  it('considers multiple colors', () => {
    const palette1 = [...REFERENCE_PALETTE_COLORS]
    palette1[1] = convertRgbToOkhsl([0, 0, 0])

    const score1 = getPaletteScore(palette1, REFERENCE_PALETTE)

    const palette2 = [...REFERENCE_PALETTE_COLORS]
    palette2[1] = convertRgbToOkhsl([0, 0, 0])
    palette2[2] = convertRgbToOkhsl([0, 0, 0])

    const score2 = getPaletteScore(palette2, REFERENCE_PALETTE)

    expect(score2).toBeGreaterThan(score1)
  })

  it('considers hue', () => {
    const palette = [...REFERENCE_PALETTE_COLORS]
    palette[1] = { ...palette[1], h: (palette[1].h ?? 0) * 0.7 }

    expect(getPaletteScore(palette, REFERENCE_PALETTE)).toBeGreaterThan(0)
  })

  it('considers saturation', () => {
    const palette = [...REFERENCE_PALETTE_COLORS]
    palette[1] = { ...palette[1], s: (palette[1].s ?? 0) * 0.7 }

    expect(getPaletteScore(palette, REFERENCE_PALETTE)).toBeGreaterThan(0)
  })

  it('considers saturation', () => {
    const palette = [...REFERENCE_PALETTE_COLORS]
    palette[1] = { ...palette[1], s: (palette[1].s ?? 0) * 0.7 }

    expect(getPaletteScore(palette, REFERENCE_PALETTE)).toBeGreaterThan(0)
  })

  it('considers hue weights', () => {
    const palette = [...REFERENCE_PALETTE_COLORS]
    palette[1] = { ...palette[1], h: 0 }

    const scoreWithoutWeight = getPaletteScore(palette, REFERENCE_PALETTE_WITHOUT_WEIGHTS)
    const scoreWithWeight = getPaletteScore(palette, REFERENCE_PALETTE)

    expect(scoreWithWeight).toBeGreaterThan(scoreWithoutWeight)
  })

  it('considers lightness weights', () => {
    const palette = [...REFERENCE_PALETTE_COLORS]
    palette[0] = { ...palette[0], l: 100 }

    const scoreWithoutWeight = getPaletteScore(palette, REFERENCE_PALETTE_WITHOUT_WEIGHTS)
    const scoreWithWeight = getPaletteScore(palette, REFERENCE_PALETTE)

    expect(scoreWithWeight).toBeGreaterThan(scoreWithoutWeight)
  })

  it('considers saturation weights', () => {
    const palette = [...REFERENCE_PALETTE_COLORS]
    palette[1] = { ...palette[1], s: 0 }

    const scoreWithoutWeight = getPaletteScore(palette, REFERENCE_PALETTE_WITHOUT_WEIGHTS)
    const scoreWithWeight = getPaletteScore(palette, REFERENCE_PALETTE)

    expect(scoreWithWeight).toBeGreaterThan(scoreWithoutWeight)
  })



})
