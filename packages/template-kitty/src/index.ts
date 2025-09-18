// Minimal types to avoid cross-package build ordering constraints
type TerminalColors = [
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
type SemanticColors = {
  background: { terminalColor: { fg: string; bg: string } };
  [k: string]: unknown; // other fields are not used here
};
export type ColorScheme = {
  terminal: TerminalColors;
  contrastColors: unknown;
  semanticColors: SemanticColors;
};

export type RenderOptions = {
  // Optional theme name to emit as a comment header
  name?: string;
};

export function renderKittyTheme(
  scheme: ColorScheme,
  opts: RenderOptions = {},
): string {
  const { terminal, semanticColors } = scheme;
  const bg = String(semanticColors.background.terminalColor.bg);
  const fg = String(semanticColors.background.terminalColor.fg);

  const lines: string[] = [];
  if (opts.name) {
    lines.push(`# ${opts.name}`);
  }
  // Core UI colors
  lines.push(`background ${bg}`);
  lines.push(`foreground ${fg}`);
  // Reasonable defaults; callers can tweak after generation
  lines.push(`cursor ${fg}`);
  lines.push(`selection_background ${fg}`);
  lines.push(`selection_foreground ${bg}`);

  // 16-color palette
  for (let i = 0; i < terminal.length; i++) {
    lines.push(`color${i} ${terminal[i]}`);
  }

  return lines.join("\n") + "\n";
}

export default { renderKittyTheme };
