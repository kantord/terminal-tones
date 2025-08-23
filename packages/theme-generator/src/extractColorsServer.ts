import getBestColorScheme, { REFERENCE_PALETTE_DARK } from "./colorScheme.js";
import { convertRgbToOkhsl } from "./extractColorsFromImage.js";
import type { Okhsl as OkhslColor } from "culori";
import { getPalette } from "colorthief";

export async function extractBase16FromRemoteImage(
  imageUrl: string,
  colorCount: number = 24,
): Promise<OkhslColor[] | null> {
  try {
    // ColorThief (Node) can read remote URLs and returns Array<[r,g,b]>
    const rgbTriplets = (await getPalette(imageUrl, colorCount)) as [number, number, number][];

    const okhslCandidates = rgbTriplets.map(convertRgbToOkhsl);
    if (okhslCandidates.length < REFERENCE_PALETTE_DARK.length) {
      return null;
    }
    const base16 = getBestColorScheme(okhslCandidates, REFERENCE_PALETTE_DARK);
    return base16 as OkhslColor[];
  } catch (error) {
    return null;
  }
}
