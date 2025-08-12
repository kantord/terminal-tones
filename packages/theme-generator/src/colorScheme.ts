import type { Okhsl } from "culori";
import { getColorScore } from "./palette";
import { ReferenceColor } from "./types";
import munkres from "munkres";
import { convertRgbToOkhsl } from "./extractColorsFromImage";

export const REFERENCE_PALETTE_DARK: ReferenceColor[] = [
  [convertRgbToOkhsl([0, 0, 0]), { l: 2 }],           // Black
  [convertRgbToOkhsl([128, 0, 0]), { h: 3, s: 2 }],   // Dark Red
  [convertRgbToOkhsl([0, 128, 0]), { h: 3, s: 2 }],   // Dark Green
  [convertRgbToOkhsl([128, 128, 0]), { h: 3, s: 2 }], // Dark Yellow
  [convertRgbToOkhsl([0, 0, 128])],                    // Dark Blue
  [convertRgbToOkhsl([128, 0, 128])],                  // Dark Magenta
  [convertRgbToOkhsl([0, 128, 128])],                  // Dark Cyan
  [convertRgbToOkhsl([192, 192, 192])],                // Light Gray

  [convertRgbToOkhsl([128, 128, 128])],                // Dark Gray
  [convertRgbToOkhsl([255, 0, 0]), { h: 3, s: 2 }],   // Bright Red
  [convertRgbToOkhsl([0, 255, 0]), { h: 3, s: 2 }],   // Bright Green
  [convertRgbToOkhsl([255, 255, 0]), { h: 3, s: 2 }], // Bright Yellow
  [convertRgbToOkhsl([0, 0, 255])],                    // Bright Blue
  [convertRgbToOkhsl([255, 0, 255])],                  // Bright Magenta
  [convertRgbToOkhsl([0, 255, 255])],                  // Bright Cyan
  [convertRgbToOkhsl([255, 255, 255]), { l: 2 }],     // White
];

export const REFERENCE_PALETTE_LIGHT: ReferenceColor[] = [
  // White background
  [convertRgbToOkhsl([255, 255, 255]), { l: 2 }],

  // Dark colors: keep hues but set moderate lightness for legibility on white
  [{ ...convertRgbToOkhsl([128, 0, 0]), l: 0.35 }, { h: 3, s: 2 }],   // Dark Red
  [{ ...convertRgbToOkhsl([0, 128, 0]), l: 0.35 }, { h: 3, s: 2 }],   // Dark Green
  [{ ...convertRgbToOkhsl([128, 128, 0]), l: 0.35 }, { h: 3, s: 2 }], // Dark Yellow
  [{ ...convertRgbToOkhsl([0, 0, 128]), l: 0.35 }],                    // Dark Blue
  [{ ...convertRgbToOkhsl([128, 0, 128]), l: 0.35 }],                  // Dark Magenta
  [{ ...convertRgbToOkhsl([0, 128, 128]), l: 0.35 }],                  // Dark Cyan

  // Grays
  [{ ...convertRgbToOkhsl([192, 192, 192]), l: 0.70 }],                // Light Gray
  [{ ...convertRgbToOkhsl([128, 128, 128]), l: 0.50 }],                // Dark Gray

  // Bright colors: slightly lighter than dark variants but not near-white
  [{ ...convertRgbToOkhsl([255, 0, 0]), l: 0.55 }, { h: 3, s: 2 }],   // Bright Red
  [{ ...convertRgbToOkhsl([0, 255, 0]), l: 0.55 }, { h: 3, s: 2 }],   // Bright Green
  [{ ...convertRgbToOkhsl([255, 255, 0]), l: 0.55 }, { h: 3, s: 2 }], // Bright Yellow
  [{ ...convertRgbToOkhsl([0, 0, 255]), l: 0.55 }],                    // Bright Blue
  [{ ...convertRgbToOkhsl([255, 0, 255]), l: 0.55 }],                  // Bright Magenta
  [{ ...convertRgbToOkhsl([0, 255, 255]), l: 0.55 }],                  // Bright Cyan

  // Black text
  [convertRgbToOkhsl([0, 0, 0]), { l: 2 }],
];



export default function getBestColorScheme(
  colours: Okhsl[],
  referencePalette: ReferenceColor[],
): Okhsl[] {
  const m = referencePalette.length;
  const n = colours.length;

  if (n < m) {
    throw new Error(
      `Need at least ${m} candidate colours, but received only ${n}.`,
    );
  }

  const cost: number[][] = referencePalette.map((ref) =>
    colours.map((cand) => getColorScore(cand, ref)),
  );

  const assignment = munkres(cost);

  assignment.sort(([r1], [r2]) => r1 - r2);
  return assignment.map(([, col]) => colours[col]);
}
