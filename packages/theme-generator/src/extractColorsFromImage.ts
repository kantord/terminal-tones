import ColorThief, { RGBColor } from "colorthief";
import { convertOklabToOkhsl, convertRgbToOklab } from "culori";

export function convertRgbToOkhsl([r, g, b]: RGBColor) {
  const oklab = convertRgbToOklab({ r, g, b, alpha: 1.0 });

  return convertOklabToOkhsl(oklab);
}

export function extractColorsFromImage(sourceImage: HTMLImageElement) {
  const colorThief = new ColorThief();
  const colors = colorThief.getPalette(sourceImage);

  return colors.map(convertRgbToOkhsl);
}
