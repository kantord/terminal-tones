import type { Theme, CssColor } from "@adobe/leonardo-contrast-colors";

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
  semanticColors: SemanticColors;
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
  mode: "light" | "dark";
  lightnessMultiplier?: number;
  contrastMultiplier?: number;
};

type CCElement = Theme["contrastColors"][number];
export type ContrastGroup = Extract<
  CCElement,
  {
    name: string;
    values: { name: string; contrast: number; value: CssColor }[];
  }
>;
export type BackgroundGroup = Extract<CCElement, { background: CssColor }>;

export type SemanticEntry<T> = {
  terminalColor: string;
  color: T;
};

export type SemanticColors = {
  background: SemanticEntry<BackgroundGroup>;
  neutral: SemanticEntry<ContrastGroup>;
  error: SemanticEntry<ContrastGroup>;
  success: SemanticEntry<ContrastGroup>;
  warning: SemanticEntry<ContrastGroup>;
  primary: SemanticEntry<ContrastGroup>;
  secondary: SemanticEntry<ContrastGroup>;
};
