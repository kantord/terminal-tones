import { RGB } from './colorExtraction';
import { GeneratedTheme } from './themeGeneration';

/**
 * Simplified color variant - just a basic color
 */
export interface ColorVariant {
  hex: string;
  rgb: RGB;
}

/**
 * Simplified enhanced theme - just the basic theme with hex colors
 */
export interface EnhancedTheme extends GeneratedTheme {
  backgroundHex: string;
  allColorsHex: string[]; // All 16 colors as hex strings
}

/**
 * Convert hex to RGB tuple
 */
function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

// Removed complex color variant generation - no optimization needed

/**
 * Generate simplified enhanced theme - just add hex representations
 */
export function generateEnhancedTheme(baseTheme: GeneratedTheme): EnhancedTheme {
  const backgroundHex = `#${baseTheme.base00}`;
  
  // Just collect all the colors as hex strings - no complex variants
  const allColorsHex = [
    `#${baseTheme.base00}`, `#${baseTheme.base01}`, `#${baseTheme.base02}`, `#${baseTheme.base03}`,
    `#${baseTheme.base04}`, `#${baseTheme.base05}`, `#${baseTheme.base06}`, `#${baseTheme.base07}`,
    `#${baseTheme.base08}`, `#${baseTheme.base09}`, `#${baseTheme.base0A}`, `#${baseTheme.base0B}`,
    `#${baseTheme.base0C}`, `#${baseTheme.base0D}`, `#${baseTheme.base0E}`, `#${baseTheme.base0F}`
  ];
  
  return {
    ...baseTheme,
    backgroundHex,
    allColorsHex
  };
}

/**
 * Get all colors from enhanced theme as flat array
 */
export function getEnhancedThemeColors(enhancedTheme: EnhancedTheme): RGB[] {
  // Simply convert all hex colors to RGB
  return enhancedTheme.allColorsHex.map(hex => hexToRgb(hex));
}