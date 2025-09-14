import type { CssColor } from "@adobe/leonardo-contrast-colors";
import type { ImageFilePath, InputImage, TerminalColors, ColorScheme, GenerateOptions } from "./types";
import { normalizeHex } from "./utils";
import { getContrastPalette } from "./contrast";
import { assignTerminalColorsOKHSL } from "./cost-matrix";
import { stealPalette } from "./palette";

export * from "./types";

export { assignTerminalColorsOKHSL };

export async function generateColorScheme(
  image: InputImage,
  options: GenerateOptions,
): Promise<ColorScheme> {
  const stolenPalette = await stealPalette(image);
  if (stolenPalette.length < 17) {
    throw new Error(
      `Palette too small: got ${stolenPalette.length}, need ≥ 17`,
    );
  }

  const { mapping } = assignTerminalColorsOKHSL(stolenPalette, {}, options.mode);
  const ordered17 = mapping.map((idx) => normalizeHex(stolenPalette[idx]));
  const contrastColors = getContrastPalette(
    ordered17 as CssColor[],
    options.lightnessMultiplier ?? 1,
    options.contrastMultiplier ?? 1,
    options.mode,
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
