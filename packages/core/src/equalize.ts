import type { TerminalColors } from "./types";
import type { CssColor } from "@adobe/leonardo-contrast-colors";
import { okhslToHex, toOkhsl } from "./utils";

// Equalize perceived lightness (OKHSL L) relative to background across hues.
// - Excludes background (index 0)
// - Equalizes normal (1..7) and bright (9..15) separately
// - Preserves hue and saturation; only adjusts L and clamps to [0,1]
export function equalizeTerminalLightnessOKHSL(
  terminal: TerminalColors,
): TerminalColors {
  const out = terminal.slice() as TerminalColors;
  const bgL = toOkhsl(out[0]).l ?? 0;

  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const setL = (hex: string, newL: number) => {
    const o = toOkhsl(hex);
    o.l = clamp01(newL);
    return okhslToHex(o);
  };
  const delta = (hex: string) => Math.abs((toOkhsl(hex).l ?? 0) - bgL);
  const sign = (hex: string) => ((toOkhsl(hex).l ?? 0) >= bgL ? 1 : -1);

  const normalIdx = [1, 2, 3, 4, 5, 6, 7] as const;
  const brightIdx = [9, 10, 11, 12, 13, 14, 15] as const;

  const avg = (arr: number[]) =>
    arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);

  const targetNormal = avg(normalIdx.map((i) => delta(out[i])));
  const targetBright = avg(brightIdx.map((i) => delta(out[i])));

  const eq = (i: number, target: number) => {
    const s = sign(out[i]);
    out[i] = setL(out[i], bgL + s * target);
  };

  normalIdx.forEach((i) => eq(i, targetNormal));
  brightIdx.forEach((i) => eq(i, targetBright));

  return out;
}

// Equalize OKHSL L for input color keys before Leonardo theme generation.
// - Excludes background at backgroundIndex (default 0)
// - Uses the average absolute L delta from background across all non-bg colors
// - Preserves the original direction (lighter or darker than background)
export function equalizePaletteLightnessOKHSL(
  rawColors: CssColor[],
  backgroundIndex = 0,
): CssColor[] {
  const out = rawColors.slice() as CssColor[];
  const bgL = toOkhsl(String(out[backgroundIndex])).l ?? 0;

  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const setL = (hex: string, newL: number) => {
    const o = toOkhsl(String(hex));
    o.l = clamp01(newL);
    return okhslToHex(o) as CssColor;
  };
  const delta = (hex: string) => Math.abs((toOkhsl(String(hex)).l ?? 0) - bgL);
  const sign = (hex: string) => ((toOkhsl(String(hex)).l ?? 0) >= bgL ? 1 : -1);

  const allIdx = Array.from({ length: out.length }, (_, i) => i);
  const idxs = allIdx.filter((i) => i !== backgroundIndex);

  if (idxs.length === 0) return out;

  const target =
    idxs.map((i) => delta(String(out[i]))).reduce((a, b) => a + b, 0) /
    idxs.length;

  for (const i of idxs) {
    const s = sign(String(out[i]));
    out[i] = setL(String(out[i]), bgL + s * target);
  }
  return out;
}
