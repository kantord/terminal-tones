import {
  BackgroundColor,
  Color,
  Theme,
  type CssColor,
} from "@adobe/leonardo-contrast-colors";
import { getPalette } from "colorthief";
import { converter } from "culori";
import { minWeightAssign } from "munkres-algorithm";

type ImageFilePath = string;
type InputImage = HTMLImageElement | ImageFilePath;
type TerminalColors = [
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
  CssColor,
];
type ColorScheme = {
  terminal: TerminalColors;
  contrastColors: Theme["contrastColors"];
};

export type DiffWeightOverrides = { wL?: number; wS?: number; wH?: number };
export type RefEntry = [hex: string, weights?: DiffWeightOverrides];

export const TERMINAL_16_REF: RefEntry[] = [
  ["#000000", { wL: 5, wH: 0, wS: 0 }], // 0 black
  ["#800000", { wH: 5 }], // 1 red
  ["#008000", { wH: 5 }], // 2 green
  ["#808000", { wL: 1.1 }], // 3 yellow
  ["#000080", { wH: 1.2 }], // 4 blue
  ["#800080", { wH: 1.2 }], // 5 magenta
  ["#008080", { wH: 1.2 }], // 6 cyan
  ["#c0c0c0", { wL: 5, wH: 0, wS: 0 }], // 7 white (light gray)
  ["#808080", { wL: 5, wH: 0, wS: 0 }], // 8 bright black (dark gray)
  ["#ff0000", { wH: 5 }], // 9 bright red
  ["#00ff00", { wH: 5 }], // 10 bright green
  ["#ffff00", { wS: 1.1 }], // 11 bright yellow
  ["#0000ff"], // 12 bright blue
  ["#ff00ff"], // 13 bright magenta
  ["#00ffff"], // 14 bright cyan
  ["#ffffff", { wL: 5, wH: 0, wS: 0 }], // 15 bright white
];

type OKHSL = {
  mode: "okhsl";
  h?: number;
  s?: number;
  l?: number;
  alpha?: number;
};
const toOkhsl = converter("okhsl") as (c: string | { mode?: string }) => OKHSL;

function isHexColor(s: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());
}

function hueDeltaDeg(h1?: number, h2?: number): number {
  const a = (((h1 ?? 0) % 360) + 360) % 360;
  const b = (((h2 ?? 0) % 360) + 360) % 360;
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function okhslDiff(aHex: string, bHex: string) {
  const a = toOkhsl(aHex);
  const b = toOkhsl(bHex);
  return {
    dL: Math.abs((a.l ?? 0) - (b.l ?? 0)),
    dS: Math.abs((a.s ?? 0) - (b.s ?? 0)),
    dH: hueDeltaDeg(a.h, b.h),
  };
}

export type LHSWeights = {
  wL?: number;
  wS?: number;
  wH?: number;
  normalizeHue?: boolean;
};

const DEFAULT_WEIGHTS: Required<LHSWeights> = {
  wL: 1,
  wS: 1,
  wH: 1,
  normalizeHue: true,
};

function lhsCost(
  d: { dL: number; dS: number; dH: number },
  w: LHSWeights = {},
): number {
  const { wL, wS, wH, normalizeHue } = { ...DEFAULT_WEIGHTS, ...w };
  const hTerm = normalizeHue ? d.dH / 180 : d.dH;
  return wL * d.dL + wS * d.dS + wH * hTerm;
}

export type AssignmentDetail = {
  terminalIndex: number;
  inputIndex: number;
  dL: number;
  dS: number;
  dH: number;
  cost: number;
};

export type AssignmentResult = {
  mapping: number[];
  totalCost: number;
  details: AssignmentDetail[];
};

function buildCostMatrix(inputs: string[], weights: LHSWeights): number[][] {
  const refs = TERMINAL_16_REF.map(([hex]) => toOkhsl(hex));
  const ins = inputs.map(toOkhsl);

  const rows = 16;
  const cols = inputs.length;
  const cost: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0),
  );

  const normalizeHue = weights.normalizeHue ?? DEFAULT_WEIGHTS.normalizeHue;

  for (let r = 0; r < rows; r++) {
    const [, overrides] = TERMINAL_16_REF[r];
    const wL = overrides?.wL ?? 1;
    const wS = overrides?.wS ?? 1;
    const wH = overrides?.wH ?? 1;

    for (let c = 0; c < cols; c++) {
      const dL = Math.abs((refs[r].l ?? 0) - (ins[c].l ?? 0));
      const dS = Math.abs((refs[r].s ?? 0) - (ins[c].s ?? 0));
      const dH = hueDeltaDeg(refs[r].h, ins[c].h);
      cost[r][c] = lhsCost({ dL, dS, dH }, { wL, wS, wH, normalizeHue });
    }
  }
  return cost;
}

export function assignTerminalColorsOKHSL(
  inputHexColors: string[],
  weights: LHSWeights = {},
): AssignmentResult {
  if (!Array.isArray(inputHexColors) || inputHexColors.length < 16) {
    throw new Error("Provide an array of at least 16 hex colors.");
  }
  inputHexColors.forEach((hex, i) => {
    if (!isHexColor(hex))
      throw new Error(`Invalid hex at index ${i}: "${hex}"`);
  });

  const cost = buildCostMatrix(inputHexColors, weights);

  const { assignments, assignmentsWeight } = minWeightAssign(cost);

  const mapping: number[] = new Array(16);
  const details: AssignmentDetail[] = [];
  let sum = 0;

  for (let r = 0; r < 16; r++) {
    const c = assignments[r] as number; // expect full assignment
    mapping[r] = c;

    const d = okhslDiff(TERMINAL_16_REF[r][0], inputHexColors[c]);
    const costVal = lhsCost(d, weights);
    details.push({
      terminalIndex: r,
      inputIndex: c,
      dL: d.dL,
      dS: d.dS,
      dH: d.dH,
      cost: costVal,
    });
    sum += costVal;
  }

  const totalCost = Number.isFinite(assignmentsWeight)
    ? assignmentsWeight
    : sum;

  return { mapping, totalCost, details };
}

const rgbToHex = (r: number, g: number, b: number) =>
  "#" +
  [r, g, b]
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    })
    .join("");

// normalize to lowercase #rrggbb
function normalizeHex(hex: string): string {
  const s = hex.trim().replace(/^#/, "");
  const six =
    s.length === 3
      ? s
        .split("")
        .map((ch) => ch + ch)
        .join("")
      : s;
  return ("#" + six.toLowerCase()).slice(0, 7);
}

async function stealPalette(image: InputImage) {
  return (await getPalette(image, 32)).map(
    ([r, g, b]: [number, number, number]) => rgbToHex(r, g, b),
  );
}

function getContrastPalette(
  rawColors: CssColor[],
  baseContrast: number,
) {
  const ratios = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Background is exactly terminal color 0
  const background = new BackgroundColor({
    name: "background",
    colorKeys: [rawColors[0]],
    ratios,
  });

  // Lightness derived from terminal[0] ensures Theme matches displayed background
  const l0 = toOkhsl(rawColors[0]).l;
  if (l0 == null)
    throw new Error(
      "Failed to derive OKHSL lightness from terminal background",
    );
  if (l0 < -1e-6 || l0 > 1 + 1e-6)
    throw new Error(`OKHSL lightness out of [0,1]: ${l0}`);
  // Cap lightness so it never exceeds 0.1 (i.e., 10%)
  const lCapped = Math.min(l0, 0.1);
  const lightness = Math.round(lCapped * 100);

  const colorPairs: Array<[[number, number], string]> = [
    [[1, 9], "red"],
    [[2, 10], "green"],
    [[3, 11], "yellow"],
    [[4, 12], "blue"],
    [[5, 13], "magenta"],
    [[6, 14], "cyan"],
  ];

  const colors = [
    // Neutral ramp separate from background
    new Color({
      name: "neutral",
      colorKeys: [rawColors[0], rawColors[7], rawColors[8], rawColors[15]],
      ratios,
    }),
    ...colorPairs.map(
      ([[color1Index, color2Index], name]) =>
        new Color({
          name,
          colorKeys: [rawColors[color1Index], rawColors[color2Index]],
          ratios,
        }),
    ),
  ];

  const theme = new Theme({ colors, backgroundColor: background, lightness });

  return theme.contrastColors;
}

export async function generateColorScheme(
  image: InputImage,
): Promise<ColorScheme> {
  const stolenPalette = await stealPalette(image);
  if (stolenPalette.length < 16) {
    throw new Error(
      `Palette too small: got ${stolenPalette.length}, need ≥ 16`,
    );
  }

  // Compute assignment mapping from terminal indices -> input palette indices
  const { mapping } = assignTerminalColorsOKHSL(stolenPalette);

  // Reorder the input palette to match terminal 0..15 indices
  const ordered16 = mapping.map((idx) => normalizeHex(stolenPalette[idx]));

  // Build contrast palette using the ordered terminal colors as anchors
  const contrastColors = getContrastPalette(ordered16 as CssColor[], 1);

  const terminal: TerminalColors = [
    contrastColors[0].background,
    contrastColors[2].values[1].value,
    contrastColors[3].values[1].value,
    contrastColors[4].values[1].value,
    contrastColors[5].values[1].value,
    contrastColors[6].values[1].value,
    contrastColors[7].values[1].value,
    contrastColors[1].values[2].value,
    contrastColors[1].values[1].value,
    contrastColors[2].values[5].value,
    contrastColors[3].values[5].value,
    contrastColors[4].values[5].value,
    contrastColors[5].values[5].value,
    contrastColors[6].values[5].value,
    contrastColors[7].values[5].value,
    contrastColors[1].values[5].value,
  ]

  return { terminal, contrastColors };
}
