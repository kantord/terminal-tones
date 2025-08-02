import { RGB } from './colorExtraction';
import { GENERATED_FLAVORS, FLAVOR_NAMES, type FlavorScheme } from './generatedFlavors';

// Cache for performance
let flavorNames: string[] | null = null;

/**
 * Curated selection of high-quality, diverse color schemes for faster exhaustive search
 * 5 dark themes + 5 light themes representing different color palettes and styles
 */
const CURATED_FLAVORS = [
  // Dark themes (5)
  'dracula',           // Popular purple/pink dark theme
  'gruvbox-dark',      // Warm, earthy dark theme  
  'catppuccin-mocha',  // Modern pastel dark theme
  'tokyo-night-dark',  // Blue/purple dark theme
  'nord',              // Cool blue/gray dark theme
  
  // Light themes (5)  
  'catppuccin-latte',  // Modern pastel light theme
  'gruvbox-light',     // Warm, earthy light theme
  'github',            // Clean, minimal light theme
  'solarized-light',   // Classic light theme
  'rose-pine-dawn'     // Warm, rosy light theme
];

/**
 * Get a list of all available flavor names
 * Returns curated selection for faster exhaustive search performance
 */
export function getAvailableFlavors(): string[] {
  if (flavorNames) {
    return flavorNames;
  }
  
  // Validate that all curated flavors exist
  const validatedFlavors = CURATED_FLAVORS.filter(name => {
    const exists = GENERATED_FLAVORS[name] !== undefined;
    if (!exists) {
      console.warn(`Curated flavor "${name}" not found in GENERATED_FLAVORS`);
    }
    return exists;
  });
  
  if (validatedFlavors.length < 10) {
    console.warn(`Only ${validatedFlavors.length}/10 curated flavors found. Falling back to first 10 available flavors.`);
    flavorNames = FLAVOR_NAMES.slice(0, 10);
  } else {
    flavorNames = validatedFlavors;
  }
  
  console.log(`Using ${flavorNames.length} curated flavors for exhaustive search:`, flavorNames);
  return flavorNames;
}

/**
 * Get a flavor scheme by name
 */
export function getFlavor(name: string): FlavorScheme | null {
  return GENERATED_FLAVORS[name] || null;
}

/**
 * Get all 16 colors from a flavor as RGB tuples
 */
export function getFlavorColors(name: string): RGB[] {
  const flavor = getFlavor(name);
  if (!flavor) {
    throw new Error(`Flavor "${name}" not found`);
  }

  return [
    hexToRgb(flavor.base00),
    hexToRgb(flavor.base01),
    hexToRgb(flavor.base02),
    hexToRgb(flavor.base03),
    hexToRgb(flavor.base04),
    hexToRgb(flavor.base05),
    hexToRgb(flavor.base06),
    hexToRgb(flavor.base07),
    hexToRgb(flavor.base08),
    hexToRgb(flavor.base09),
    hexToRgb(flavor.base0A),
    hexToRgb(flavor.base0B),
    hexToRgb(flavor.base0C),
    hexToRgb(flavor.base0D),
    hexToRgb(flavor.base0E),
    hexToRgb(flavor.base0F)
  ];
}

/**
 * Get flavor metadata (name, author, etc.) without colors
 */
export function getFlavorMetadata(name: string): Pick<FlavorScheme, 'scheme' | 'author' | 'slug'> | null {
  const flavor = getFlavor(name);
  if (!flavor) {
    return null;
  }
  
  return {
    scheme: flavor.scheme,
    author: flavor.author,
    slug: flavor.slug
  };
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

/**
 * Search flavors by name
 */
export function searchFlavors(query: string): string[] {
  const allFlavors = getAvailableFlavors();
  const lowercaseQuery = query.toLowerCase();
  
  return allFlavors.filter(flavorName => {
    const flavor = GENERATED_FLAVORS[flavorName];
    if (!flavor) return false;
    
    return (
      flavorName.toLowerCase().includes(lowercaseQuery) ||
      flavor.scheme.toLowerCase().includes(lowercaseQuery) ||
      flavor.author.toLowerCase().includes(lowercaseQuery)
    );
  });
}

// Export type for compatibility
export type FlavorName = string;
export type { FlavorScheme };