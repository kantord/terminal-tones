import { converter } from "culori";
import type { Theme, CssColor } from "@adobe/leonardo-contrast-colors";
import type {
  ContrastGroup,
  GenerateOptions,
  InputImage,
  SemanticColors,
  TerminalColors,
  BackgroundGroup,
} from "./types";
import { stealPalette } from "./palette";
import { assignTerminalColorsOKHSL } from "./cost-matrix";
import { normalizeHex } from "./utils";
import { getContrastPalette } from "./contrast";

// ---------- OKLab helpers ----------
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

// ---------- Contrast group guard ----------
type CCElement = Theme["contrastColors"][number];
function isContrastGroup(x: CCElement): x is ContrastGroup {
  if (!x || typeof x !== "object") return false;
  const o = x as { name?: unknown; values?: unknown };
  if (typeof o.name !== "string" || !Array.isArray(o.values)) return false;
  return o.values.every((v: unknown) => {
    if (!v || typeof v !== "object") return false;
    const vv = v as { name?: unknown; value?: unknown; contrast?: unknown };
    return (
      typeof vv.name === "string" &&
      typeof vv.value === "string" &&
      typeof vv.contrast === "number"
    );
  });
}

// ---------- Fuzzy weights (OKLab) ----------
type RGB = [number, number, number];
type RGBA = [number, number, number, number];

export function fuzzyPaletteWeightsOKLab(
  paletteHex: CssColor[],
  sampledPixels: Array<RGB | RGBA>,
  opts: {
    sigma?: number;
    alphaThreshold?: number;
    ignoreNearWhite?: boolean;
    whiteRgbThreshold?: number;
  } = {},
): number[] {
  const sigma = opts.sigma ?? 0.06;
  const alphaThreshold = opts.alphaThreshold ?? 0;
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
    const p = toOkLab({ mode: "rgb", r: r / 255, g: g / 255, b: b / 255 });
    const pl = p.l ?? 0,
      pa = p.a ?? 0,
      pb = p.b ?? 0;
    for (let k = 0; k < pal.length; k++) {
      const q = pal[k];
      const dl = pl - (q.l ?? 0);
      const da = pa - (q.a ?? 0);
      const db = pb - (q.b ?? 0);
      const dist2 = dl * dl + da * da + db * db;
      sums[k] += Math.exp(-dist2 / (2 * s2));
    }
  }
  const total = sums.reduce((a, b) => a + b, 0);
  if (!isFinite(total) || total <= 0) return sums.map(() => 0);
  return sums.map((x) => x / total);
}

// ---------- Accent extraction ----------
// Eligible accent groups and their indices in the 17-ordered raw colors
// 0: bg, 1: neutral, 2: red, 3: green, 4: yellow, 5: blue, 6: magenta, 7: cyan, 8: orange
const GROUPS = [
  { name: "yellow", idx: [3, 11] as const },
  { name: "blue", idx: [4, 12] as const },
  { name: "magenta", idx: [5, 13] as const },
  { name: "cyan", idx: [6, 14] as const },
] as const;

export async function extractAccents(
  image: InputImage,
  options: GenerateOptions,
): Promise<{
  primary: { name: (typeof GROUPS)[number]["name"]; hex: string };
  secondary: { name: (typeof GROUPS)[number]["name"]; hex: string };
}> {
  const stolenPalette = await stealPalette(image);
  const { mapping } = assignTerminalColorsOKHSL(
    stolenPalette,
    {},
    options.mode,
  );
  const ordered17 = mapping.map((i) =>
    normalizeHex(stolenPalette[i]),
  ) as CssColor[];
  const contrastColors = getContrastPalette(ordered17, options);

  const centroids = GROUPS.map((g) => {
    const a = oklab(String(ordered17[g.idx[0]]));
    const b = oklab(String(ordered17[g.idx[1]]));
    return avg(a, b);
  });

  const tau = 4;
  const sigma = 0.06;
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

  const order = scores
    .map((s, i) => [s, i] as const)
    .sort((a, b) => b[0] - a[0])
    .map(([, i]) => i);
  const primaryIdx = order[0] ?? 0;
  const secondaryIdx = order.find((i) => i !== primaryIdx) ?? 1;

  function repHex(groupName: string): string {
    const g = contrastColors.find(
      (x): x is ContrastGroup => isContrastGroup(x) && x.name === groupName,
    );
    if (g && g.values.length) {
      const idx = Math.min(5, g.values.length - 1);
      return String(g.values[idx].value);
    }
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

function getGroup(
  contrastColors: Theme["contrastColors"],
  name: string,
): ContrastGroup {
  const g = contrastColors.find(
    (x): x is ContrastGroup => isContrastGroup(x) && x.name === name,
  );
  if (!g) throw new Error(`Missing group: ${name}`);
  return g;
}

const brightIndexByName: Record<string, number> = {
  red: 9,
  green: 10,
  yellow: 11,
  blue: 12,
  magenta: 13,
  cyan: 14,
};

export async function computeSemanticColors(
  contrastColors: Theme["contrastColors"],
  terminal: TerminalColors,
  image: InputImage,
  options: GenerateOptions,
): Promise<SemanticColors> {
  const semanticColors: SemanticColors = {
    background: {
      terminalColor: terminal[0],
      color: contrastColors[0] as BackgroundGroup,
    },
    neutral: {
      terminalColor: terminal[7],
      color: getGroup(contrastColors, "neutral"),
    },
    error: {
      terminalColor: terminal[brightIndexByName.red],
      color: getGroup(contrastColors, "red"),
    },
    success: {
      terminalColor: terminal[brightIndexByName.green],
      color: getGroup(contrastColors, "green"),
    },
    warning: {
      terminalColor: terminal[brightIndexByName.yellow],
      color: getGroup(contrastColors, "yellow"),
    },
    primary: {
      terminalColor: terminal[12],
      color: getGroup(contrastColors, "blue"),
    },
    secondary: {
      terminalColor: terminal[14],
      color: getGroup(contrastColors, "cyan"),
    },
  };

  try {
    const accents = await extractAccents(image, options);
    const primaryName = accents.primary.name;
    const secondaryName = accents.secondary.name;
    const pIdx = brightIndexByName[primaryName] ?? 12;
    const sIdx = brightIndexByName[secondaryName] ?? 14;
    semanticColors.primary = {
      terminalColor: terminal[pIdx],
      color: getGroup(contrastColors, primaryName),
    };
    semanticColors.secondary = {
      terminalColor: terminal[sIdx],
      color: getGroup(contrastColors, secondaryName),
    };
  } catch {
    // keep defaults
  }

  return semanticColors;
}
