import type { Okhsl } from "culori";

export type OptimizeColorschemeOptions = {
  backgroundLightness: number; // target L for the "black" slot
  foregroundLightness: number; // target L for bright color slots
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Adjusts lightness values of a 16-color terminal palette.
 *
 * Expected input order is the same as produced by getBestColorScheme using
 * either the dark or light reference palettes.
 *
 * Rules:
 * - Set the lightness of the "black" slot to backgroundLightness
 * - Set the lightness of bright color slots (indices 9..14) to foregroundLightness
 * - Set the lightness of dark color slots (indices 1..6) to midpoint(background, foreground)
 * - For grayscale helpers: set dark gray (index 8) to midpoint; set light gray (index 7) to foreground
 * - Set the opposite extreme ("white" slot) to foregroundLightness
 */
export function optimizeColorscheme(
  colours: Okhsl[],
  options: OptimizeColorschemeOptions,
): Okhsl[] {
  const { backgroundLightness, foregroundLightness } = options;

  if (!Array.isArray(colours) || colours.length < 2) {
    throw new Error(
      "optimizeColorscheme requires at least 2 colors (background and foreground)",
    );
  }

  if (colours.length < 16) {
    // Return a shallow copy without changes if the input doesn't look like a base16 palette
    return colours.slice();
  }

  const bgL = clamp01(backgroundLightness);
  const fgL = clamp01(foregroundLightness);
  const midL = clamp01((bgL + fgL) / 2);

  // Assume black is the first color and white is the last color
  // (the calling code must ensure palettes follow this convention)
  const blackIndex = 0;
  const whiteIndex = colours.length - 1;

  // Indices by convention (same for dark and light reference palettes)
  const darkColorIndices = [1, 2, 3, 4, 5, 6];
  const lightGrayIndex = 7;
  const darkGrayIndex = 8;
  const brightColorIndices = [9, 10, 11, 12, 13, 14];

  return colours.map((color, index) => {
    const newL = (() => {
      if (index === blackIndex) return bgL;
      if (index === whiteIndex) return fgL;
      if (brightColorIndices.includes(index)) return fgL;
      if (darkColorIndices.includes(index)) return midL;
      if (index === darkGrayIndex) return midL;
      if (index === lightGrayIndex) return fgL;
      // Any other slots: keep their original lightness
      return color.l;
    })();

    return { ...color, l: newL } as Okhsl;
  });
}

export default optimizeColorscheme;
