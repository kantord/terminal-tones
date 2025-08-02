import { Color, BackgroundColor, Theme } from '@adobe/leonardo-contrast-colors';
import { RGB } from './colorExtraction';
import { OptimalPairingResult } from './terminalColors';

/**
 * Leonardo color variant with contrast ratio information
 */
export interface LeonardoVariant {
  name: string;
  contrast: number;
  value: string; // hex color
}

/**
 * Leonardo variants result for all accent colors
 */
export interface LeonardoVariantsResult {
  backgroundColor: string; // hex color matched with black
  foregroundColor: string; // white
  accentVariants: {
    originalColor: string; // hex of the original extracted color
    colorName: string; // e.g., "accent1", "accent2", etc.
    variants: LeonardoVariant[];
  }[];
  totalVariants: number;
}

/**
 * Convert RGB tuple to hex string
 */
function rgbToHex(rgb: RGB): string {
  const [r, g, b] = rgb;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Generate Leonardo contrast variants using the ANSI pairing result
 * Uses the color matched with black as background, white as foreground,
 * and generates 10 contrast variants for each remaining color as accents
 */
export function generateLeonardoVariants(
  ansiPairing: OptimalPairingResult,
  allExtractedColors: RGB[]
): LeonardoVariantsResult {
  // Find the color that was matched with black (ANSI index 0)
  // Black is at index 0 in the ANSI colors array
  const blackIndex = 0;
  const blackPairing = ansiPairing.pairings[blackIndex];
  
  if (!blackPairing) {
    throw new Error('Could not find color matched with black in ANSI pairing');
  }
  
  const backgroundColorRgb = blackPairing.extractedColor;
  const backgroundColor = rgbToHex(backgroundColorRgb);
  const foregroundColor = '#ffffff'; // White
  
  // Get all extracted colors except the one used as background
  const backgroundExtractedIndex = ansiPairing.selectedIndices[blackIndex];
  const accentColors = allExtractedColors.filter((_, index) => index !== backgroundExtractedIndex);
  
  // Target contrast ratios - 10 variants from accessible to very high contrast
  const contrastRatios = [1.5, 2, 3, 4.5, 6, 8, 10, 12, 15, 18];
  
  // Generate Leonardo background color
  const leonardoBackground = new BackgroundColor({
    name: 'background',
    colorKeys: [backgroundColor as any],
    ratios: [1] // Just the base color
  });
  
  // Generate accent color variants
  const accentVariants = accentColors.map((accentRgb, index) => {
    const accentHex = rgbToHex(accentRgb);
    const colorName = `accent${index + 1}`;
    
    // Create Leonardo Color for this accent
    const leonardoAccent = new Color({
      name: colorName,
      colorKeys: [accentHex as any],
      ratios: contrastRatios,
      colorspace: 'LCH' // Use LCH for perceptually uniform interpolation
    });
    
    // Create Leonardo theme to generate variants
    const theme = new Theme({
      colors: [leonardoBackground, leonardoAccent],
      backgroundColor: leonardoBackground,
      lightness: getLightnessFromColor(backgroundColor),
      contrast: 1
    });
    
    // Extract the generated variants
    const themeColors = theme.contrastColors;
    const accentColorData = themeColors.find(color => 
      'name' in color && color.name === colorName
    );
    
    if (!accentColorData || !('values' in accentColorData)) {
      throw new Error(`Could not find generated variants for ${colorName}`);
    }
    
    const variants: LeonardoVariant[] = accentColorData.values.map((variant: any) => ({
      name: variant.name,
      contrast: variant.contrast,
      value: variant.value
    }));
    
    return {
      originalColor: accentHex,
      colorName,
      variants
    };
  });
  
  return {
    backgroundColor,
    foregroundColor,
    accentVariants,
    totalVariants: accentVariants.length * contrastRatios.length
  };
}

/**
 * Extract lightness value from a hex color (0-100)
 * Simple approximation using RGB luminance
 */
function getLightnessFromColor(hex: string): number {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // Calculate relative luminance (simplified)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Convert to lightness percentage
  return Math.round(luminance * 100);
}