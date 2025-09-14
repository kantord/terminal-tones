import { converter } from "culori";
import type { CssColor } from "@adobe/leonardo-contrast-colors";

type RGB = [number, number, number];
type RGBA = [number, number, number, number];

const toOkLab = converter("oklab") as (
  c: string | { mode?: string; r?: number; g?: number; b?: number },
) => { mode: "oklab"; l?: number; a?: number; b?: number };

function rgb01(rgb: RGB) {
  const [r, g, b] = rgb;
  return { mode: "rgb", r: r / 255, g: g / 255, b: b / 255 } as const;
}

export type FuzzyWeightOptions = {
  sigma?: number; // kernel width in OKLab units
  alphaThreshold?: number; // ignore RGBA pixels with alpha below this (0..255)
  ignoreNearWhite?: boolean; // drop near-white pixels (Colorthief-style)
  whiteRgbThreshold?: number; // 0..255 per-channel threshold for near-white
};

/**
 * Compute soft assignment weights for a palette over a set of sampled pixels.
 * - Distance metric: OKLab Euclidean
 * - Kernel: Gaussian with sigma (default 0.06)
 * - Filters: optional alpha threshold and near-white drop (R,G,B > threshold)
 * Returns normalized weights that sum to 1.
 */
export function fuzzyPaletteWeightsOKLab(
  paletteHex: CssColor[],
  sampledPixels: Array<RGB | RGBA>,
  opts: FuzzyWeightOptions = {},
): number[] {
  const sigma = opts.sigma ?? 0.06;
  const alphaThreshold = opts.alphaThreshold ?? 0; // keep all by default
  const ignoreNearWhite = opts.ignoreNearWhite ?? true;
  const whiteRgbThreshold = opts.whiteRgbThreshold ?? 250;

  const s2 = sigma * sigma;
  const pal = paletteHex.map((h) => toOkLab(String(h)));
  const sums = new Array(pal.length).fill(0) as number[];

  for (const px of sampledPixels) {
    const [r, g, b, a] = px as RGBA;
    if (typeof a === "number" && a < alphaThreshold) continue;
    if (
      ignoreNearWhite &&
      r > whiteRgbThreshold &&
      g > whiteRgbThreshold &&
      b > whiteRgbThreshold
    )
      continue;

    const p = toOkLab(rgb01([r, g, b]));
    const pl = p.l ?? 0,
      pa = p.a ?? 0,
      pb = p.b ?? 0;

    for (let k = 0; k < pal.length; k++) {
      const q = pal[k];
      const dl = pl - (q.l ?? 0);
      const da = pa - (q.a ?? 0);
      const db = pb - (q.b ?? 0);
      const d2 = dl * dl + da * da + db * db;
      sums[k] += Math.exp(-d2 / (2 * s2));
    }
  }
  const total = sums.reduce((a, b) => a + b, 0);
  if (!isFinite(total) || total <= 0) return sums.map(() => 0);
  return sums.map((x) => x / total);
}
