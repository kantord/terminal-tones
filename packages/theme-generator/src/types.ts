import type { Okhsl } from "culori";

export type Palette = Okhsl[];
export type ReferenceColorWeights = {
  h?: number;
  s?: number;
  l?: number;
};
export type ReferenceColor = [Okhsl, ReferenceColorWeights] | [Okhsl];
export function ref(
  color: Okhsl,
  weights: ReferenceColorWeights = {},
): ReferenceColor {
  return [color, weights];
}
