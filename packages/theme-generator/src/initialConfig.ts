import type { Okhsl } from "culori";
import type { ReferenceColor } from "./types";

export type InitialCustomization = {
  blackPointLightness: number;
  whitePointLightness: number;
  dynamicRange: number;
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Derives initial black/white points and dynamic range from an ordered base16 theme
 * and its reference palette.
 *
 * Assumptions:
 * - Theme `base16` is ordered to match the reference palette using getBestColorScheme
 * - Background is at index 0, foreground at the last index
 * - For light reference palettes, reference background is lighter than foreground;
 *   for dark palettes, the opposite holds
 */
export function deriveInitialCustomization(
  base16: Okhsl[],
  referencePalette: ReferenceColor[],
): InitialCustomization {
  if (!Array.isArray(base16) || !Array.isArray(referencePalette)) {
    throw new Error("deriveInitialCustomization requires arrays");
    }
  if (base16.length !== referencePalette.length) {
    throw new Error(
      "deriveInitialCustomization requires base16 to match referencePalette length",
    );
  }
  if (base16.length < 2) {
    throw new Error("deriveInitialCustomization requires at least 2 colors");
  }

  const backgroundIndex = 0;
  const foregroundIndex = base16.length - 1;
  // Choose endpoints strictly from the first (background) and last (foreground)
  // slots of the generated theme. Darker becomes black point, lighter becomes white point.
  const firstRaw = base16[backgroundIndex]?.l ?? 0;
  const lastRaw = base16[foregroundIndex]?.l ?? 1;
  const firstL = firstRaw > 1 ? clamp01(firstRaw / 100) : clamp01(firstRaw);
  const lastL = lastRaw > 1 ? clamp01(lastRaw / 100) : clamp01(lastRaw);
  const blackPointLightness = Math.min(firstL, lastL);
  const whitePointLightness = Math.max(firstL, lastL);
  const dynamicRange = clamp01(whitePointLightness - blackPointLightness);

  return { blackPointLightness, whitePointLightness, dynamicRange };
}

export default deriveInitialCustomization;
