import type { CssColor } from "@adobe/leonardo-contrast-colors";
import { okhslToHex, toOkhsl } from "./utils";

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
