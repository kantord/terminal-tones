import type { CssColor } from "@adobe/leonardo-contrast-colors";
import type {
  ImageFilePath,
  InputImage,
  TerminalColors,
  ColorScheme,
  DiffWeightOverrides,
  OKHSL,
  LHSWeights,
  AssignmentDetail,
  AssignmentResult,
  GenerateOptions,
} from "./types";
import { getPalette } from "colorthief";
import { toOkhsl, isHexColor, hueDeltaDeg, okhslDiff, rgbToHex, normalizeHex } from "./utils";
import { minWeightAssign } from "munkres-algorithm";
import { getContrastPalette } from "./contrast";
import { REFERENCE_COLORS } from "./reference-palette";

export * from "./types";

export { okhslDiff };

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

function buildCostMatrix(inputs: string[], weights: LHSWeights): number[][] {
  const refs = REFERENCE_COLORS.map(([hex]) => toOkhsl(hex));
  const ins = inputs.map(toOkhsl);

  const rows = 17;
  const cols = inputs.length;
  const cost: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0),
  );

  const normalizeHue = weights.normalizeHue ?? DEFAULT_WEIGHTS.normalizeHue;

  for (let r = 0; r < rows; r++) {
    const [, overrides] = REFERENCE_COLORS[r];
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
  if (!Array.isArray(inputHexColors) || inputHexColors.length < 17) {
    throw new Error("Provide an array of at least 17 hex colors.");
  }
  inputHexColors.forEach((hex, i) => {
    if (!isHexColor(hex))
      throw new Error(`Invalid hex at index ${i}: "${hex}"`);
  });

  const cost = buildCostMatrix(inputHexColors, weights);

  const { assignments, assignmentsWeight } = minWeightAssign(cost);

  const mapping: number[] = new Array(17);
  const details: AssignmentDetail[] = [];
  let sum = 0;

  for (let r = 0; r < 17; r++) {
    const c = assignments[r] as number; // expect full assignment
    mapping[r] = c;

    const d = okhslDiff(REFERENCE_COLORS[r][0], inputHexColors[c]);
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

// rgbToHex and normalizeHex moved to utils

async function stealPalette(image: InputImage) {
  return (await getPalette(image, 30, 100)).map(
    ([r, g, b]: [number, number, number]) => rgbToHex(r, g, b),
  );
}

// getContrastPalette moved to ./contrast

export async function generateColorScheme(
  image: InputImage,
  options: GenerateOptions = {},
): Promise<ColorScheme> {
  const stolenPalette = await stealPalette(image);
  if (stolenPalette.length < 17) {
    throw new Error(
      `Palette too small: got ${stolenPalette.length}, need ≥ 17`,
    );
  }

  // Compute assignment mapping from terminal indices -> input palette indices
  const { mapping } = assignTerminalColorsOKHSL(stolenPalette);

  // Reorder the input palette to match terminal 0..15 indices
  const ordered17 = mapping.map((idx) => normalizeHex(stolenPalette[idx]));

  // Build contrast palette using the ordered terminal colors as anchors
  const contrastColors = getContrastPalette(
    ordered17 as CssColor[],
    options.lightnessMultiplier ?? 1,
    options.contrastMultiplier ?? 1,
  );

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
