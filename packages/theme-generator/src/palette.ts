import { type Okhsl } from "culori";
import { ReferenceColor, ReferenceColorWeights } from "./types";

export function getColorScore(
  color: Okhsl,
  [reference, weights = {}]: ReferenceColor,
): number {
  const { h: hWeight = 1, l: lWeight = 1, s: sWeight = 1 } = weights;
  const lightnessScore = Math.abs(color.l - reference.l);
  const naiveHueDistance =
    reference.h !== undefined ? Math.abs(reference.h - (color.h ?? 255)) : 0;
  const hueScore = Math.min(naiveHueDistance, 360 - naiveHueDistance);
  const saturationScore =
    reference.s !== undefined ? Math.abs(reference.s - (color.s ?? 255)) : 0;

  return (
    lightnessScore * lWeight + hueScore * hWeight + saturationScore * sWeight
  );
}
