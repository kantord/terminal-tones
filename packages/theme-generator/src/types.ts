import type { Okhsl } from "culori";

export type Palette = Okhsl[];
export type ReferenceColorWeights = {
  h?: number; // Hue weight
  s?: number; // Saturation weight
  l?: number; // Lightness weight
};
export type ReferenceColor = [Okhsl, ReferenceColorWeights] | [Okhsl];
export function ref(
  color: Okhsl,
  weights: ReferenceColorWeights = {},
): ReferenceColor {
  return [color, weights];
}
