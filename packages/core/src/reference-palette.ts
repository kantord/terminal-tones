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

export function getReferenceColors(mode: "light" | "dark"): RefEntry[] {
  if (mode === "dark") return REFERENCE_COLORS_DARK;
  // Light mode: swap neutrals so background is white (#ffffff) at index 0,
  // and grayscale roles (7 and 8) are swapped accordingly.
  const arr = [...REFERENCE_COLORS_DARK];
  const idx0 = 0,
    idx15 = 15,
    idx7 = 7,
    idx8 = 8;
  const tmp0 = arr[idx0];
  arr[idx0] = arr[idx15];
  arr[idx15] = tmp0;
  const tmp7 = arr[idx7];
  arr[idx7] = arr[idx8];
  arr[idx8] = tmp7;
  return arr;
}

// Backwards export for any internal imports expecting REFERENCE_COLORS
export const REFERENCE_COLORS = REFERENCE_COLORS_DARK;
