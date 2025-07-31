import { differenceCiede2000, parse } from 'culori';
import { RGB } from './colorExtraction';
import { FlavorScheme, getFlavorColors, FlavorName, getFlavor } from './flavors';

export const deltaE = differenceCiede2000(); // cache once

export function isPerceptible(a: string, b: string, threshold = 2.3): boolean {
  const parsedA = parse(a);
  const parsedB = parse(b);
  
  if (!parsedA || !parsedB) {
    return false; // If colors can't be parsed, consider them not perceptibly different
  }
  
  return deltaE(parsedA, parsedB) > threshold;
}

/**
 * Convert RGB tuple to hex string
 */
function rgbToHex(rgb: RGB): string {
  const [r, g, b] = rgb;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Calculate perceptual difference between two RGB colors using CIEDE2000
 */
function calculateColorDifference(color1: RGB, color2: RGB): number {
  const hex1 = rgbToHex(color1);
  const hex2 = rgbToHex(color2);
  const parsed1 = parse(hex1);
  const parsed2 = parse(hex2);
  
  if (!parsed1 || !parsed2) {
    return Infinity; // Invalid color
  }
  
  return deltaE(parsed1, parsed2);
}

/**
 * Find the optimal mapping between extracted colors and flavor colors
 * Returns an array where index corresponds to flavor color position (base00-base0F)
 * and value is the index of the best matching extracted color
 */
function findOptimalColorMapping(extractedColors: RGB[], flavorColors: RGB[]): number[] {
  const numColors = Math.min(extractedColors.length, flavorColors.length);
  
  // Calculate all pairwise distances
  const distances: number[][] = [];
  for (let i = 0; i < numColors; i++) {
    distances[i] = [];
    for (let j = 0; j < numColors; j++) {
      distances[i][j] = calculateColorDifference(flavorColors[i], extractedColors[j]);
    }
  }
  
  // Use Hungarian algorithm (simplified greedy approach for now)
  // This finds a good mapping but may not be globally optimal
  const mapping: number[] = new Array(numColors);
  const usedExtractedColors = new Set<number>();
  
  // For each flavor color position, find the best available extracted color
  for (let flavorIndex = 0; flavorIndex < numColors; flavorIndex++) {
    let bestExtractedIndex = -1;
    let bestDistance = Infinity;
    
    for (let extractedIndex = 0; extractedIndex < numColors; extractedIndex++) {
      if (!usedExtractedColors.has(extractedIndex)) {
        const distance = distances[flavorIndex][extractedIndex];
        if (distance < bestDistance) {
          bestDistance = distance;
          bestExtractedIndex = extractedIndex;
        }
      }
    }
    
    if (bestExtractedIndex !== -1) {
      mapping[flavorIndex] = bestExtractedIndex;
      usedExtractedColors.add(bestExtractedIndex);
    } else {
      // Fallback if no colors available (shouldn't happen in normal case)
      mapping[flavorIndex] = flavorIndex % extractedColors.length;
    }
  }
  
  return mapping;
}

/**
 * Calculate total perceptual difference for a given mapping
 */
function calculateMappingScore(extractedColors: RGB[], flavorColors: RGB[], mapping: number[]): number {
  let totalDifference = 0;
  for (let i = 0; i < mapping.length; i++) {
    totalDifference += calculateColorDifference(flavorColors[i], extractedColors[mapping[i]]);
  }
  return totalDifference;
}

/**
 * Generate a theme by mapping extracted colors to flavor structure
 */
export interface GeneratedTheme extends FlavorScheme {
  mappingScore: number;
  colorMapping: number[];
}

export function generateThemeFromImageAndFlavor(
  extractedColors: RGB[], 
  flavorName: FlavorName
): GeneratedTheme {
  console.time('generateTheme');
  const flavorColors = getFlavorColors(flavorName);
  
  // Ensure we have exactly 16 colors to work with
  const normalizedExtractedColors = extractedColors.slice(0, 16);
  while (normalizedExtractedColors.length < 16) {
    // If we have fewer than 16 colors, repeat the existing ones
    normalizedExtractedColors.push(...extractedColors.slice(0, 16 - normalizedExtractedColors.length));
  }
  
  console.time('findOptimalMapping');
  // Find optimal mapping
  const mapping = findOptimalColorMapping(normalizedExtractedColors, flavorColors);
  console.timeEnd('findOptimalMapping');
  
  const mappingScore = calculateMappingScore(normalizedExtractedColors, flavorColors, mapping);
  
  // Create the theme using mapped colors
  const mappedColors = mapping.map(index => rgbToHex(normalizedExtractedColors[index]));
  
  // Get base flavor metadata
  const baseFlavor = getFlavor(flavorName);
  if (!baseFlavor) {
    throw new Error(`Flavor "${flavorName}" not found`);
  }
  
  const result = {
    scheme: `${baseFlavor.scheme} (Custom)`,
    author: `Generated from ${baseFlavor.author}`,
    slug: `${baseFlavor.slug || flavorName}-custom`,
    base00: mappedColors[0].replace('#', ''),
    base01: mappedColors[1].replace('#', ''),
    base02: mappedColors[2].replace('#', ''),
    base03: mappedColors[3].replace('#', ''),
    base04: mappedColors[4].replace('#', ''),
    base05: mappedColors[5].replace('#', ''),
    base06: mappedColors[6].replace('#', ''),
    base07: mappedColors[7].replace('#', ''),
    base08: mappedColors[8].replace('#', ''),
    base09: mappedColors[9].replace('#', ''),
    base0A: mappedColors[10].replace('#', ''),
    base0B: mappedColors[11].replace('#', ''),
    base0C: mappedColors[12].replace('#', ''),
    base0D: mappedColors[13].replace('#', ''),
    base0E: mappedColors[14].replace('#', ''),
    base0F: mappedColors[15].replace('#', ''),
    mappingScore,
    colorMapping: mapping
  };
  
  console.timeEnd('generateTheme');
  return result;
}

/**
 * Find the best matching flavor for the given extracted colors
 * Returns the flavor name that has the lowest total perceptual difference
 */
export function findBestMatchingFlavor(extractedColors: RGB[], availableFlavors: FlavorName[]): FlavorName {
  console.time('findBestMatchingFlavor');
  
  let bestFlavor: FlavorName = availableFlavors[0];
  let bestScore = Infinity;
  
  for (const flavorName of availableFlavors) {
    const flavorColors = getFlavorColors(flavorName);
    
    // Normalize extracted colors to 16
    const normalizedExtractedColors = extractedColors.slice(0, 16);
    while (normalizedExtractedColors.length < 16) {
      normalizedExtractedColors.push(...extractedColors.slice(0, 16 - normalizedExtractedColors.length));
    }
    
    // Find optimal mapping and calculate score
    const mapping = findOptimalColorMapping(normalizedExtractedColors, flavorColors);
    const score = calculateMappingScore(normalizedExtractedColors, flavorColors, mapping);
    
    console.log(`Flavor ${flavorName} score: ${score.toFixed(2)}`);
    
    if (score < bestScore) {
      bestScore = score;
      bestFlavor = flavorName;
    }
  }
  
  console.log(`Best matching flavor: ${bestFlavor} with score ${bestScore.toFixed(2)}`);
  console.timeEnd('findBestMatchingFlavor');
  
  return bestFlavor;
}

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