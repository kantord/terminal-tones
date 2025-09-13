import type { Theme } from "@adobe/leonardo-contrast-colors";

export type ImageFilePath = string;
export type InputImage = HTMLImageElement | ImageFilePath;

export type TerminalColors = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export type ColorScheme = {
  terminal: TerminalColors;
  contrastColors: Theme["contrastColors"];
};

export type DiffWeightOverrides = { wL?: number; wS?: number; wH?: number };
export type RefEntry = [hex: string, weights?: DiffWeightOverrides];

export type OKHSL = {
  mode: "okhsl";
  h?: number;
  s?: number;
  l?: number;
  alpha?: number;
};

export type LHSWeights = {
  wL?: number;
  wS?: number;
  wH?: number;
  normalizeHue?: boolean;
};

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

export type GenerateOptions = {
  lightnessMultiplier?: number;
  contrastMultiplier?: number;
};

