import type { CssColor } from "@adobe/leonardo-contrast-colors";
import type { ImageFilePath, InputImage, TerminalColors, ColorScheme, GenerateOptions } from "./types";
import { normalizeHex } from "./utils";
import { getContrastPalette } from "./contrast";
import { assignTerminalColorsOKHSL } from "./cost-matrix";
import { stealPalette } from "./palette";

export * from "./types";

// Cost matrix helpers are re-exported from cost-matrix
export { assignTerminalColorsOKHSL };

// cost-matrix: moved DEFAULT_WEIGHTS, lhsCost, buildCostMatrix to ./cost-matrix

// cost-matrix: moved assignTerminalColorsOKHSL to ./cost-matrix

// palette: stealPalette moved to ./palette

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
