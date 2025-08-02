import { RGB } from './colorExtraction';

// Simplified version - no complex perceptual calculations needed
export function isPerceptible(a: string, b: string, threshold = 2.3): boolean {
  return a !== b; // Simple comparison - if colors are different, they're perceptible
}

/**
 * Convert RGB tuple to hex string
 */
function rgbToHex(rgb: RGB): string {
  const [r, g, b] = rgb;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// No complex optimization - just use direct mapping

/**
 * Simple theme interface with just Base16 color scheme
 */
export interface GeneratedTheme {
  scheme: string;
  author: string;
  slug: string;
  base00: string; // Background
  base01: string; // Lighter Background
  base02: string; // Selection Background  
  base03: string; // Comments
  base04: string; // Dark Foreground
  base05: string; // Default Foreground
  base06: string; // Light Foreground
  base07: string; // Light Background
  base08: string; // Variables
  base09: string; // Integers
  base0A: string; // Classes
  base0B: string; // Strings
  base0C: string; // Support
  base0D: string; // Functions
  base0E: string; // Keywords
  base0F: string; // Deprecated
}

export function generateThemeFromImage(extractedColors: RGB[]): GeneratedTheme {
  // Simple approach: use the first 16 extracted colors directly
  if (extractedColors.length < 16) {
    throw new Error(`Expected at least 16 extracted colors, got ${extractedColors.length}`);
  }
  
  // Take only the first 16 colors and map them directly to base00-base0F
  const themeColors = extractedColors.slice(0, 16).map(rgb => rgbToHex(rgb));
  
  return {
    scheme: 'Custom Image Theme',
    author: 'Generated from image',
    slug: 'custom-image-theme',
    base00: themeColors[0].replace('#', ''),
    base01: themeColors[1].replace('#', ''),
    base02: themeColors[2].replace('#', ''),
    base03: themeColors[3].replace('#', ''),
    base04: themeColors[4].replace('#', ''),
    base05: themeColors[5].replace('#', ''),
    base06: themeColors[6].replace('#', ''),
    base07: themeColors[7].replace('#', ''),
    base08: themeColors[8].replace('#', ''),
    base09: themeColors[9].replace('#', ''),
    base0A: themeColors[10].replace('#', ''),
    base0B: themeColors[11].replace('#', ''),
    base0C: themeColors[12].replace('#', ''),
    base0D: themeColors[13].replace('#', ''),
    base0E: themeColors[14].replace('#', ''),
    base0F: themeColors[15].replace('#', '')
  };
}

// No flavor matching needed - removed all flavor logic



// No complex processing needed

/**
 * Get the 16 colors from a generated theme as RGB tuples
 */
export function getGeneratedThemeColors(theme: GeneratedTheme): RGB[] {
  return [
    hexToRgb(theme.base00),
    hexToRgb(theme.base01),
    hexToRgb(theme.base02),
    hexToRgb(theme.base03),
    hexToRgb(theme.base04),
    hexToRgb(theme.base05),
    hexToRgb(theme.base06),
    hexToRgb(theme.base07),
    hexToRgb(theme.base08),
    hexToRgb(theme.base09),
    hexToRgb(theme.base0A),
    hexToRgb(theme.base0B),
    hexToRgb(theme.base0C),
    hexToRgb(theme.base0D),
    hexToRgb(theme.base0E),
    hexToRgb(theme.base0F)
  ];
}

/**
 * Convert hex color to RGB tuple
 */
function hexToRgb(hex: string): RGB {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return [r, g, b];
}