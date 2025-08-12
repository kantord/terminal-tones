import type { Okhsl } from "culori";
import type { ReferenceColor } from "./types";

export type OptimizeColorschemeOptions = {
  blackPointLightness: number; // target L for the darkest slot
  whitePointLightness: number; // target L for the brightest slot
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
  const { blackPointLightness, whitePointLightness } = options;
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

  // Use fixed anchors for assigning exact endpoints, but normalize by reference min/max
  const backgroundIndex = 0;
  const foregroundIndex = referencePalette.length - 1;
  const refBgAnchor = clamp01(referencePalette[backgroundIndex][0].l ?? 0);
  const refFgAnchor = clamp01(referencePalette[foregroundIndex][0].l ?? 1);
  let refMin = 1;
  let refMax = 0;
  for (const [ref] of referencePalette) {
    const l = clamp01(ref.l ?? 0);
    if (l < refMin) refMin = l;
    if (l > refMax) refMax = l;
  }

  // Map using black/white points as anchors, normalizing by full reference range
  const denom = refMax - refMin;
  const blackL = clamp01(blackPointLightness);
  const whiteL = clamp01(whitePointLightness);

  return colours.map((color, index) => {
    const refL = clamp01(referencePalette[index][0].l ?? color.l ?? 0);
    let t = 0;
    if (Math.abs(denom) > 1e-6) {
      t = clamp01((refL - refMin) / denom);
    }
    // Set exact endpoints for background/foreground slots
    // If background is lighter than foreground (light scheme), background maps to white point.
    // Otherwise (dark scheme), background maps to black point.
    let newL = blackL + t * (whiteL - blackL);
    if (index === backgroundIndex) {
      newL = refBgAnchor > refFgAnchor ? whiteL : blackL;
    } else if (index === foregroundIndex) {
      newL = refBgAnchor > refFgAnchor ? blackL : whiteL;
    }
    // Avoid collapsing many slots to pure white or pure black due to extreme white/black points
    if (index !== backgroundIndex) {
      newL = Math.min(newL, 0.98);
    }
    if (index !== foregroundIndex) {
      newL = Math.max(newL, 0.02);
    }
    return { ...color, l: clamp01(newL) } as Okhsl;
  });
}

export default optimizeColorscheme;
