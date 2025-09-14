import { getPalette } from "colorthief";
import type { InputImage } from "./types";
import { rgbToHex } from "./utils";

export async function stealPalette(image: InputImage): Promise<string[]> {
  const palette = await getPalette(image, 30, 100);
  return palette.map(([r, g, b]: [number, number, number]) =>
    rgbToHex(r, g, b),
  );
}
