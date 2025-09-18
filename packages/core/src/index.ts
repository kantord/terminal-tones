import type { CssColor } from "@adobe/leonardo-contrast-colors";
import type {
  InputImage,
  TerminalColors,
  ColorScheme,
  GenerateOptions,
} from "./types";
import { normalizeHex, okhslToHex, toOkhsl } from "./utils";
import { getContrastPalette } from "./contrast";
import { assignTerminalColorsOKHSL } from "./cost-matrix";
import { stealPalette } from "./palette";
import { computeSemanticColors } from "./semantic";

export * from "./types";
export { fuzzyPaletteWeightsOKLab, extractAccents } from "./semantic";

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

  const { mapping } = assignTerminalColorsOKHSL(
    stolenPalette,
    {},
    options.mode,
  );
  const ordered17 = mapping.map((idx) => normalizeHex(stolenPalette[idx]));
  const contrastColors = getContrastPalette(ordered17 as CssColor[], options);

  console.log(contrastColors[2]);

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
  ];

  // Optional adjustments in OKHSL space
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const flm = options.foregroundLightnessMultiplier ?? 1;
  const sm = options.saturationMultiplier ?? 1;

  // Lightness: only foreground indices
  if (Math.abs(flm - 1) > 1e-9) {
    const adjustL = (hex: string) => {
      const o = toOkhsl(String(hex));
      o.l = clamp01((o.l ?? 0) * flm);
      return okhslToHex(o);
    };
    const fgIdx = new Set<number>([7, 8, 9, 10, 11, 12, 13, 14, 15]);
    for (const i of fgIdx) terminal[i] = adjustL(terminal[i]);
  }

  // Saturation: apply to all terminal colors to keep harmony consistent
  if (Math.abs(sm - 1) > 1e-9) {
    const adjustS = (hex: string) => {
      const o = toOkhsl(String(hex));
      o.s = clamp01((o.s ?? 0) * sm);
      return okhslToHex(o);
    };
    for (let i = 0; i < terminal.length; i++)
      terminal[i] = adjustS(terminal[i]);
  }

  const semanticColors = await computeSemanticColors(
    contrastColors,
    terminal,
    image,
    options,
  );

  return { terminal, contrastColors, semanticColors };
}
