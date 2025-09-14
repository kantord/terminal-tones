import type { RefEntry } from "./types";

export const REFERENCE_COLORS_DARK: RefEntry[] = [
  ["#000000", { wL: 8, wH: 0, wS: 0 }], // 0 black
  ["#800000", { wH: 5, wS: 3 }], // 1 red
  ["#008000", { wH: 5, wS: 3 }], // 2 green
  ["#808000"], // 3 yellow
  ["#000080"], // 4 blue
  ["#800080"], // 5 magenta
  ["#008080"], // 6 cyan
  ["#c0c0c0", { wL: 5, wH: 0, wS: 2 }], // 7 white (light gray)
  ["#808080", { wL: 5, wH: 0, wS: 2 }], // 8 bright black (dark gray)
  ["#ff0000", { wH: 5, wS: 3 }], // 9 bright red
  ["#00ff00", { wH: 5, wS: 3 }], // 10 bright green
  ["#ffff00"], // 11 bright yellow
  ["#0000ff"], // 12 bright blue
  ["#ff00ff"], // 13 bright magenta
  ["#00ffff"], // 14 bright cyan
  ["#ffffff", { wL: 8, wH: 0, wS: 5 }], // 15 bright white
  ["#ffa500", { wL: 5, wS: 3, wH: 5 }], // 16 orange
];

export const REFERENCE_COLORS_LIGHT: RefEntry[] = [
  ["#ffffff", { wL: 8, wH: 0, wS: 5 }], // 0 white
  ["#800000", { wH: 5, wS: 3 }], // 1 red
  ["#008000", { wH: 5, wS: 3 }], // 2 green
  ["#808000"], // 3 yellow
  ["#000080"], // 4 blue
  ["#800080"], // 5 magenta
  ["#008080"], // 6 cyan
  ["#808080", { wL: 5, wH: 0, wS: 2 }], // 7 dark gray
  ["#c0c0c0", { wL: 5, wH: 0, wS: 2 }], // 8 light gray
  ["#ff0000", { wH: 5, wS: 3 }], // 9 bright red
  ["#00ff00", { wH: 5, wS: 3 }], // 10 bright green
  ["#ffff00"], // 11 bright yellow
  ["#0000ff"], // 12 bright blue
  ["#ff00ff"], // 13 bright magenta
  ["#00ffff"], // 14 bright cyan
  ["#000000", { wL: 8, wH: 0, wS: 0 }], // 15 black
  ["#ffa500", { wL: 5, wS: 3, wH: 5 }], // 16 orange
];

export function getReferenceColors(mode: "light" | "dark"): RefEntry[] {
  return mode === "dark" ? REFERENCE_COLORS_DARK : REFERENCE_COLORS_LIGHT;
}
