import { minWeightAssign } from "munkres-algorithm";
import { getReferenceColors } from "./reference-palette";
import { toOkhsl, hueDeltaDeg, okhslDiff, isHexColor } from "./utils";
import type { LHSWeights, AssignmentDetail, AssignmentResult } from "./types";

export const DEFAULT_WEIGHTS: Required<LHSWeights> = {
  wL: 1,
  wS: 1,
  wH: 1,
  normalizeHue: true,
};

export function lhsCost(
  d: { dL: number; dS: number; dH: number },
  w: LHSWeights = {},
): number {
  const { wL, wS, wH, normalizeHue } = { ...DEFAULT_WEIGHTS, ...w };
  const hTerm = normalizeHue ? d.dH / 180 : d.dH;
  return wL * d.dL + wS * d.dS + wH * hTerm;
}

export function buildCostMatrix(
  inputs: string[],
  weights: LHSWeights,
  mode: "light" | "dark",
): number[][] {
  const REFERENCE_COLORS = getReferenceColors(mode);
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
  mode: "light" | "dark",
): AssignmentResult {
  if (!Array.isArray(inputHexColors) || inputHexColors.length < 17) {
    throw new Error("Provide an array of at least 17 hex colors.");
  }
  inputHexColors.forEach((hex, i) => {
    if (!isHexColor(hex))
      throw new Error(`Invalid hex at index ${i}: "${hex}"`);
  });

  const cost = buildCostMatrix(inputHexColors, weights, mode);
  const { assignments, assignmentsWeight } = minWeightAssign(cost);

  const mapping: number[] = new Array(17);
  const details: AssignmentDetail[] = [];
  let sum = 0;

  for (let r = 0; r < 17; r++) {
    const c = assignments[r] as number; // expect full assignment
    mapping[r] = c;

    const REFERENCE_COLORS = getReferenceColors(mode);
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
