import type { Okhsl } from "culori";
import { okhslToHex } from "./extractColorsFromImage";

/**
 * Generates a Kitty terminal colorscheme from a base16 OKHSL palette.
 * Assumptions:
 * - Palette length is 16
 * - Background is at index 0, foreground at index 15
 */
export function generateKittyConfig(palette: Okhsl[]): string {
  if (!Array.isArray(palette) || palette.length < 16) {
    throw new Error("generateKittyConfig requires a 16-color palette");
  }

  const hex = (i: number) => okhslToHex(palette[i]);

  const lines: string[] = [];
  // Core colors
  lines.push(`background ${hex(0)}`);
  lines.push(`foreground ${hex(15)}`);

  // Optional but commonly used
  lines.push(`selection_background ${hex(8)}`);
  lines.push(`selection_foreground ${hex(15)}`);
  lines.push(`cursor ${hex(15)}`);
  lines.push(`cursor_text ${hex(0)}`);

  // Base16 mapping to color0..color15
  for (let i = 0; i < 16; i += 1) {
    lines.push(`color${i} ${hex(i)}`);
  }

  return lines.join("\n");
}

export default generateKittyConfig;
