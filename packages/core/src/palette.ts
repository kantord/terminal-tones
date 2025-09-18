import { getPalette } from "colorthief";
import type { InputImage } from "./types";
import { rgbToHex } from "./utils";

export async function stealPalette(image: InputImage): Promise<string[]> {
  // Extract 16 colors first, then 6 more, and keep all results
  // (allowing some slight duplication across runs).
  const first = await getPalette(image, 16, 100);
  const second = await getPalette(image, 6, 100);
  const palette = [...first, ...second];
  return palette.map(([r, g, b]: [number, number, number]) =>
    rgbToHex(r, g, b),
  );
}
