import { RGB } from './colorExtraction';

export interface FlavorScheme {
  scheme: string;
  author: string;
  slug?: string;
  base00: string; // Background
  base01: string; // Lighter Background (Status Line)
  base02: string; // Selection Background
  base03: string; // Comments, Invisibles, Line Highlighting
  base04: string; // Dark Foreground (Status Line)
  base05: string; // Default Foreground, Caret, Delimiters, Operators
  base06: string; // Light Foreground (Not often used)
  base07: string; // Light Background (Not often used)
  base08: string; // Variables, XML Tags, Markup Link Text, Markup Lists, Diff Deleted
  base09: string; // Integers, Boolean, Constants, XML Attributes, Markup Link Url
  base0A: string; // Classes, Markup Bold, Search Text Background
  base0B: string; // Strings, Inherited Class, Markup Code, Diff Inserted
  base0C: string; // Support, Regular Expressions, Escape Characters, Markup Quotes
  base0D: string; // Functions, Methods, Attribute IDs, Headings
  base0E: string; // Keywords, Storage, Selector, Markup Italic, Diff Changed
  base0F: string; // Deprecated, Opening/Closing Embedded Language Tags
}

// Available flavors - hardcoded for now, could be made dynamic later
const AVAILABLE_FLAVORS = ['fruit-soda', 'rose-pine'] as const;
export type FlavorName = typeof AVAILABLE_FLAVORS[number];

// Hardcoded flavor data (to avoid needing YAML parser dependency)
const FLAVOR_DATA: Record<FlavorName, FlavorScheme> = {
  'fruit-soda': {
    scheme: "Fruit Soda",
    author: "jozip",
    base00: "f1ecf1",
    base01: "e0dee0",
    base02: "d8d5d5",
    base03: "b5b4b6",
    base04: "979598",
    base05: "515151",
    base06: "474545",
    base07: "2d2c2c",
    base08: "fe3e31",
    base09: "fe6d08",
    base0A: "f7e203",
    base0B: "47f74c",
    base0C: "0f9cfd",
    base0D: "2931df",
    base0E: "611fce",
    base0F: "b16f40"
  },
  'rose-pine': {
    scheme: "Rosé Pine",
    author: "Emilia Dunfelt <edun@dunfelt.se>",
    slug: "rose-pine",
    base00: "191724",
    base01: "1f1d2e",
    base02: "26233a",
    base03: "6e6a86",
    base04: "908caa",
    base05: "e0def4",
    base06: "e0def4",
    base07: "524f67",
    base08: "eb6f92",
    base09: "f6c177",
    base0A: "ebbcba",
    base0B: "31748f",
    base0C: "9ccfd8",
    base0D: "c4a7e7",
    base0E: "f6c177",
    base0F: "524f67"
  }
};

/**
 * Get a list of all available flavor names
 */
export function getAvailableFlavors(): FlavorName[] {
  return [...AVAILABLE_FLAVORS];
}

/**
 * Get a flavor scheme by name
 */
export function getFlavor(name: FlavorName): FlavorScheme | null {
  return FLAVOR_DATA[name] || null;
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
 * Get all 16 colors from a flavor as RGB tuples
 */
export function getFlavorColors(name: FlavorName): RGB[] {
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
export function getFlavorMetadata(name: FlavorName): Pick<FlavorScheme, 'scheme' | 'author' | 'slug'> | null {
  const flavor = getFlavor(name);
  if (!flavor) {
    return null;
  }

  const { scheme, author, slug } = flavor;
  return { scheme, author, slug };
} 