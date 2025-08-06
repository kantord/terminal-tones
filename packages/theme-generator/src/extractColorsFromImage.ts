import ColorThief, { RGBColor } from "colorthief";
import { convertOklabToOkhsl, convertRgbToOklab, formatHex, convertOkhslToOklab, convertOklabToRgb } from "culori";
import type { Okhsl } from "culori";

export function convertRgbToOkhsl([r, g, b]: RGBColor) {
  const oklab = convertRgbToOklab({ r, g, b, alpha: 1.0 });

  return convertOklabToOkhsl(oklab);
}

export function extractColorsFromImage(
  source: HTMLImageElement | File, 
  colorCount: number = 10
): Promise<{ colors: ReturnType<typeof convertRgbToOkhsl>[] }> {
  return new Promise((resolve, reject) => {
    const processImage = (img: HTMLImageElement) => {
      try {
        const colorThief = new ColorThief();
        const colors = colorThief.getPalette(img, colorCount);
        resolve({ colors: colors.map(convertRgbToOkhsl) });
      } catch (error) {
        reject(error);
      }
    };

    if (source instanceof HTMLImageElement) {
      // If it's already an HTMLImageElement, process it directly
      if (source.complete) {
        processImage(source);
      } else {
        source.onload = () => processImage(source);
        source.onerror = () => reject(new Error('Failed to load image'));
      }
    } else {
      // If it's a File, convert it to HTMLImageElement first
      const img = new Image();
      const url = URL.createObjectURL(source);
      
      img.onload = () => {
        URL.revokeObjectURL(url); // Clean up the object URL
        processImage(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url); // Clean up on error too
        reject(new Error('Failed to load image from file'));
      };
      
      img.src = url;
    }
  });
}

/**
 * Converts an OKHSL color to a hex string
 * @param color The OKHSL color object
 * @returns A hex color string (e.g., "#ff0000")
 */
export function okhslToHex(color: Okhsl): string {
  // Normalize the color values - culori expects lightness in 0-1 range, not 0-100
  const normalizedColor: Okhsl = {
    ...color,
    // Convert lightness from 0-100 to 0-1 range if needed
    l: color.l > 1 ? color.l / 100 : color.l
  };
  
  // Convert OKHSL → OKLAB → RGB → HEX (culori doesn't have direct OKHSL → RGB)
  const oklabColor = convertOkhslToOklab(normalizedColor);
  const rgbColor = convertOklabToRgb(oklabColor);
  return formatHex(rgbColor);
}
