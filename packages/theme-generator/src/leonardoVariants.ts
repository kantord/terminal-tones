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
 * Generated terminal color set from Leonardo variants
 */
export interface TerminalColorSet {
  normal: string[]; // Colors 0-7 (4.5:1 contrast variants)
  bright: string[]; // Colors 8-15 (8:1 contrast variants) 
  base16: string[]; // All 16 colors in base16 order
}

/**
 * Leonardo variants result for all accent colors
 */
export interface LeonardoVariantsResult {
  backgroundColor: string; // hex color matched with black
  foregroundColor: string; // extracted white color
  accentVariants: {
    originalColor: string; // hex of the original extracted color
    colorName: string; // e.g., "accent1", "accent2", etc.
    variants: LeonardoVariant[];
  }[];
  totalVariants: number;
  terminalColors: TerminalColorSet; // Generated 16 terminal colors
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
  
  // Find the color that was matched with white (ANSI index 7)
  // White is at index 7 in the ANSI colors array
  const whiteIndex = 7;
  const whitePairing = ansiPairing.pairings[whiteIndex];
  
  if (!whitePairing) {
    throw new Error('Could not find color matched with white in ANSI pairing');
  }
  
  const backgroundColorRgb = blackPairing.extractedColor;
  const backgroundColor = rgbToHex(backgroundColorRgb);
  const foregroundColorRgb = whitePairing.extractedColor;
  const foregroundColor = rgbToHex(foregroundColorRgb);
  
  // Get all extracted colors except the ones used as background and foreground
  const backgroundExtractedIndex = ansiPairing.selectedIndices[blackIndex];
  const foregroundExtractedIndex = ansiPairing.selectedIndices[whiteIndex];
  const accentColors = allExtractedColors.filter((_, index) => 
    index !== backgroundExtractedIndex && index !== foregroundExtractedIndex
  );
  
  // Add both background and foreground colors as accents (so they get their own variants)
  // Background becomes accent0, foreground becomes accent1
  accentColors.unshift(backgroundColorRgb, foregroundColorRgb);
  
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
  
  // Generate the 16 terminal colors from Leonardo variants
  const terminalColors = generateTerminalColors(ansiPairing, accentVariants);

  return {
    backgroundColor,
    foregroundColor,
    accentVariants,
    totalVariants: accentVariants.length * contrastRatios.length,
    terminalColors
  };
}

/**
 * Generate 16 terminal colors from Leonardo variants
 * Normal colors (0-7): 4.5:1 contrast variants
 * Bright colors (8-15): 8:1 contrast variants
 */
function generateTerminalColors(
  ansiPairing: OptimalPairingResult, 
  accentVariants: LeonardoVariantsResult['accentVariants']
): TerminalColorSet {
  // Map ANSI indices to accent variant indices
  // We need to map each ANSI color to its corresponding Leonardo accent
  const ansiToAccentMap: { [ansiIndex: number]: number } = {};
  
  // Create mapping from ANSI pairing to accent variants
  ansiPairing.pairings.forEach((pairing, ansiIndex) => {
    const selectedColorIndex = ansiPairing.selectedIndices[ansiIndex];
    
    // Find which accent variant corresponds to this selected color
    let accentIndex = -1;
    
    if (ansiIndex === 7) {
      // White maps to accent1 (foreground color that we added second)
      accentIndex = 1;
    } else if (ansiIndex === 0) {
      // Black maps to accent0 (background color that we added first)
      accentIndex = 0;
    } else {
      // Find the accent that matches this extracted color
      const extractedHex = rgbToHex(pairing.extractedColor);
      accentIndex = accentVariants.findIndex(accent => 
        accent.originalColor.toLowerCase() === extractedHex.toLowerCase()
      );
      
      // If not found, map to a reasonable fallback
      if (accentIndex === -1) {
        accentIndex = (ansiIndex - 1) % (accentVariants.length - 2) + 2; // Skip first two (background/foreground)
      }
    }
    
    ansiToAccentMap[ansiIndex] = accentIndex;
  });
  
  const normal: string[] = [];
  const bright: string[] = [];
  
  // Generate colors 0-7 (normal) and 8-15 (bright)
  for (let i = 0; i < 8; i++) {
    const accentIndex = ansiToAccentMap[i];
    const accent = accentVariants[accentIndex || 0];
    
    if (!accent) {
      // Fallback colors
      normal.push('#000000');
      bright.push('#808080');
      continue;
    }
    
    if (i === 0) {
      // Black (0): use original background color for normal, 6.0:1 variant for bright
      const backgroundHex = rgbToHex(ansiPairing.pairings[0].extractedColor);
      normal.push(backgroundHex);
      
      // Find 6.0:1 contrast variant for bright black
      const brightBlackVariant = accent.variants.find(v => 
        Math.abs(v.contrast - 6.0) < 0.5
      ) || accent.variants.find(v => v.contrast >= 6.0) || accent.variants[4];
      
      bright.push(brightBlackVariant?.value || accent.originalColor);
      continue;
    }
    
    // Find 4.5:1 and 8:1 contrast variants for other colors
    const normalVariant = accent.variants.find(v => 
      Math.abs(v.contrast - 4.5) < 0.5
    ) || accent.variants.find(v => v.contrast >= 4.5) || accent.variants[3];
    
    const brightVariant = accent.variants.find(v => 
      Math.abs(v.contrast - 8) < 0.5  
    ) || accent.variants.find(v => v.contrast >= 8) || accent.variants[5];
    
    normal.push(normalVariant?.value || accent.originalColor);
    bright.push(brightVariant?.value || accent.originalColor);
  }
  
  // Combine into base16 format (0-7 normal, 8-15 bright)
  const base16 = [...normal, ...bright];
  
  return {
    normal,
    bright,
    base16
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