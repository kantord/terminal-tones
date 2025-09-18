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
  // Deprecated: use backgroundLightnessMultiplier
  lightnessMultiplier?: number;
  backgroundLightnessMultiplier?: number;
  // Multiplies OKHSL lightness for the default foreground (neutral fg)
  foregroundLightnessMultiplier?: number;
  contrastMultiplier?: number;
  // Additive lift applied to all contrast ratios after multiplication.
  // Example: ratios = [1..9].map(r => r*contrastMultiplier + contrastLift)
  contrastLift?: number;
  // Spacing of contrast ratio targets used by Leonardo.
  // linear: current behavior (1..9 transformed by multiplier/lift)
  // geometric: exponential spacing between contrastMin and contrastMax with easing gamma
  contrastScale?: "linear" | "geometric";
  contrastMin?: number; // only for geometric; default chosen in implementation
  contrastMax?: number; // only for geometric; default chosen in implementation
  contrastGamma?: number; // only for geometric; default 0.7
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

export type TerminalVariants = { fg: string; bg: string };

export type SemanticEntry<T> = {
  terminalColor: TerminalVariants;
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
  tertiary: SemanticEntry<ContrastGroup>;
  quaternary: SemanticEntry<ContrastGroup>;
};
