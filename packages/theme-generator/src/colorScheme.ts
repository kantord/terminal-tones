import type { Okhsl } from "culori";
import { getColorScore } from "./palette";
import { ReferenceColor } from "./types";
import munkres from "munkres";
import { convertRgbToOkhsl } from "./extractColorsFromImage";

export const REFERENCE_PALETTE: ReferenceColor[] = [
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
