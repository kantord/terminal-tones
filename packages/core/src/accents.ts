import type { CssColor, Theme } from "@adobe/leonardo-contrast-colors";
import type { GenerateOptions, InputImage } from "./types";
import { stealPalette } from "./palette";
import { assignTerminalColorsOKHSL } from "./cost-matrix";
import { normalizeHex } from "./utils";
import { getContrastPalette } from "./contrast";
import { converter } from "culori";

const toOkLab = converter("oklab") as (
  c: string | { mode?: string; r?: number; g?: number; b?: number },
) => { mode: "oklab"; l?: number; a?: number; b?: number };

type Vec3 = { l: number; a: number; b: number };
function oklab(c: string): Vec3 {
  const x = toOkLab(c);
  return { l: x.l ?? 0, a: x.a ?? 0, b: x.b ?? 0 };
}
function avg(a: Vec3, b: Vec3): Vec3 {
  return { l: (a.l + b.l) / 2, a: (a.a + b.a) / 2, b: (a.b + b.b) / 2 };
}
function d2(a: Vec3, b: Vec3): number {
  const dl = a.l - b.l;
  const da = a.a - b.a;
  const db = a.b - b.b;
  return dl * dl + da * da + db * db;
}

// Eligible accent groups and their indices in the 17-ordered raw colors
// 0: bg, 1: neutral, 2: red, 3: green, 4: yellow, 5: blue, 6: magenta, 7: cyan, 8: orange
const GROUPS = [
  { name: "yellow", idx: [3, 11] as const },
  { name: "blue", idx: [4, 12] as const },
  { name: "magenta", idx: [5, 13] as const },
  { name: "cyan", idx: [6, 14] as const },
] as const;

export type Accent = { name: (typeof GROUPS)[number]["name"]; hex: string };

export async function extractAccents(
  image: InputImage,
  options: GenerateOptions,
): Promise<{ primary: Accent; secondary: Accent }> {
  // 1) Dominant colors from image (sorted by frequency)
  const stolenPalette = await stealPalette(image);

  // 2) Determine the 17 ordered keys and contrast palette
  const { mapping } = assignTerminalColorsOKHSL(
    stolenPalette,
    {},
    options.mode,
  );
  const ordered17 = mapping.map((i) =>
    normalizeHex(stolenPalette[i]),
  ) as CssColor[];
  const contrastColors = getContrastPalette(ordered17, options);

  // 3) Build OKLab centroids for each eligible group using the ordered keys
  const centroids = GROUPS.map((g) => {
    const a = oklab(String(ordered17[g.idx[0]]));
    const b = oklab(String(ordered17[g.idx[1]]));
    return avg(a, b);
  });

  // 4) Score groups by palette ranking and distance closeness
  const tau = 4; // rank decay
  const sigma = 0.06; // OKLab kernel width
  const twoS2 = 2 * sigma * sigma;
  const scores = new Array(GROUPS.length).fill(0) as number[];
  for (let i = 0; i < stolenPalette.length; i++) {
    const p = oklab(normalizeHex(stolenPalette[i]));
    let bestK = 0;
    let bestD2 = Infinity;
    for (let k = 0; k < centroids.length; k++) {
      const dist2 = d2(p, centroids[k]);
      if (dist2 < bestD2) {
        bestD2 = dist2;
        bestK = k;
      }
    }
    const rankWeight = Math.exp(-i / tau);
    const distWeight = Math.exp(-bestD2 / twoS2);
    scores[bestK] += rankWeight * distWeight;
  }

  // 5) Pick top-2 distinct groups
  const order = scores
    .map((s, i) => [s, i] as const)
    .sort((a, b) => b[0] - a[0])
    .map(([, i]) => i);
  const primaryIdx = order[0] ?? 0;
  const secondaryIdx = order.find((i) => i !== primaryIdx) ?? 1;

  // Representative hex: choose mid swatch (contrast ≈ 6) for the group
  function repHex(groupName: string): string {
    type CCElement = Theme["contrastColors"][number];
    type ContrastGroup = Extract<
      CCElement,
      { name: string; values: { value: CssColor }[] }
    >;
    const hasValues = (
      v: unknown,
    ): v is { name: string; contrast: number; value: CssColor } => {
      if (!v || typeof v !== "object") return false;
      const o = v as { name?: unknown; contrast?: unknown; value?: unknown };
      return (
        typeof o.name === "string" &&
        typeof o.value === "string" &&
        typeof o.contrast === "number"
      );
    };
    const isContrastGroup = (x: CCElement): x is ContrastGroup => {
      if (!x || typeof x !== "object") return false;
      const o = x as { name?: unknown; values?: unknown };
      return (
        typeof o.name === "string" &&
        Array.isArray(o.values) &&
        o.values.every(hasValues)
      );
    };

    const g = contrastColors.find(
      (x): x is ContrastGroup =>
        isContrastGroup(x) && (x as { name: string }).name === groupName,
    );
    if (g && g.values.length) {
      const idx = Math.min(5, g.values.length - 1);
      return String(g.values[idx].value);
    }
    // Fallback: use the first key color for the group
    const gi = GROUPS.findIndex((gr) => gr.name === groupName);
    const keyIdx = GROUPS[gi]?.idx?.[0] ?? 3;
    return String(ordered17[keyIdx]);
  }

  const primaryName = GROUPS[primaryIdx].name;
  const secondaryName = GROUPS[secondaryIdx].name;

  return {
    primary: { name: primaryName, hex: repHex(primaryName) },
    secondary: { name: secondaryName, hex: repHex(secondaryName) },
  };
}
