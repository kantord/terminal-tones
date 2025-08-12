import type { Okhsl } from "culori";
import type { ReferenceColor } from "./types";

export type OptimizeColorschemeOptions = {
  backgroundLightness: number;
  foregroundLightness: number;
  isLightTheme: boolean;
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Adjusts lightness values of a 16-color terminal palette by referencing
 * the lightness distribution of a reference palette, instead of using
 * hardcoded indices.
 *
 * Expected input order for `colours` is the same as produced by
 * getBestColorScheme using the provided `referencePalette`.
 *
 * Mapping logic:
 * - Take the lightness of the reference palette's first entry as the
 *   reference "background" lightness (works for both dark and light
 *   reference palettes used by the project).
 * - Find the entry whose reference lightness is farthest from background;
 *   treat that as the opposite extreme.
 * - For every slot, linearly interpolate its new lightness between
 *   backgroundLightness (t=0) and foregroundLightness (t=1) based on its
 *   reference lightness position between these two extremes.
 */
export function optimizeColorscheme(
  colours: Okhsl[],
  referencePalette: ReferenceColor[],
  options: OptimizeColorschemeOptions,
): Okhsl[] {
  const { backgroundLightness, foregroundLightness, isLightTheme } = options;
  if (!Array.isArray(colours) || colours.length < 2) {
    throw new Error(
      "optimizeColorscheme requires at least 2 colors (background and foreground)",
    );
  }

  if (!Array.isArray(referencePalette) || referencePalette.length !== colours.length) {
    throw new Error(
      "optimizeColorscheme requires a reference palette with the same length as colours",
    );
  }

  // Determine background and foreground anchors from the reference palette
  let refMin = 1;
  let refMax = 0;
  for (const [ref] of referencePalette) {
    const l = clamp01(ref.l ?? 0);
    if (l < refMin) refMin = l;
    if (l > refMax) refMax = l;
  }

  // Map background/foreground depending on theme type
  const refBg = isLightTheme ? refMax : refMin; // background anchor in reference
  const refFg = isLightTheme ? refMin : refMax; // foreground anchor in reference

  const denom = refFg - refBg;
  const bgL = clamp01(backgroundLightness);
  const fgL = clamp01(foregroundLightness);

  return colours.map((color, index) => {
    const refL = clamp01(referencePalette[index][0].l ?? color.l ?? 0);
    let t = 0;
    if (Math.abs(denom) > 1e-6) {
      t = clamp01((refL - refBg) / denom);
    }
    const newL = bgL + t * (fgL - bgL);
    return { ...color, l: clamp01(newL) } as Okhsl;
  });
}

export default optimizeColorscheme;
