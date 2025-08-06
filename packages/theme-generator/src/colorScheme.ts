import type { Okhsl } from "culori";
import { getColorScore } from "./palette";
import { ReferenceColor } from "./types";
import munkres from "munkres";

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
