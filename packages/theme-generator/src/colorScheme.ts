import { min, permutations } from "itertools";
import { getPaletteScore, Palette, ReferencePalette } from "./palette";

export default function getBestColorScheme(
  colors: Palette,
  referencePalette: ReferencePalette,
) {
  const candidates = permutations(colors, referencePalette.length);

  return min(candidates, (candidate) => {
    return getPaletteScore(candidate, referencePalette);
  });
}
