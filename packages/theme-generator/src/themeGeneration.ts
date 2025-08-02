import { differenceCiede2000, parse } from 'culori';
import { RGB } from './colorExtraction';
import { FlavorScheme, getFlavorColors, FlavorName, getFlavor } from './flavors';
import { generateEnhancedTheme, getEnhancedThemeColors } from './colorVariants';

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
 * Result of finding the best matching flavor and contrast level
 */
export interface BestFlavorMatch {
  flavorName: FlavorName;
  score: number;
}

/**
 * Find the best matching flavor using a sensible default contrast level
 * Tests all flavors with a fixed contrast multiplier for speed and simplicity
 * Returns the flavor that has the lowest total perceptual difference
 */
export async function findBestMatchingFlavor(extractedColors: RGB[], availableFlavors: FlavorName[]): Promise<BestFlavorMatch> {
  console.time('findBestMatchingFlavor');
  
  // Use a sensible default contrast level that provides good accessibility
  // while maintaining color variety and visual appeal
  const defaultContrastLevel = 1.2; // Slightly enhanced contrast for better readability
  
  console.log(`Testing ${availableFlavors.length} flavors with default contrast level ${defaultContrastLevel}x`);
  
  // Normalize extracted colors once
  const normalizedExtractedColors = extractedColors.slice(0, 16);
  while (normalizedExtractedColors.length < 16) {
    normalizedExtractedColors.push(...extractedColors.slice(0, 16 - normalizedExtractedColors.length));
  }
  
  let bestFlavor: FlavorName = availableFlavors[0];
  let bestScore = Infinity;
  
  // Test each flavor with our default contrast level
  for (const flavorName of availableFlavors) {
    try {
      const baseTheme = generateThemeFromImageAndFlavor(normalizedExtractedColors, flavorName);
      const enhancedTheme = generateEnhancedTheme(baseTheme, defaultContrastLevel);
      const enhancedColors = getEnhancedThemeColors(enhancedTheme);
      const mapping = findOptimalColorMapping(normalizedExtractedColors, enhancedColors);
      const score = calculateMappingScore(normalizedExtractedColors, enhancedColors, mapping);
      
      if (score < bestScore) {
        bestScore = score;
        bestFlavor = flavorName;
      }
      
    } catch (error) {
      console.warn(`Failed to process flavor ${flavorName}:`, error);
      continue;
    }
  }
  
  console.log(`Best match: ${bestFlavor} with score ${bestScore.toFixed(2)}`);
  console.timeEnd('findBestMatchingFlavor');
  
  return {
    flavorName: bestFlavor,
    score: bestScore
  };
}



/**
 * Process a chunk of flavors in a Web Worker
 */
async function processFlavorChunkInWorker(
  extractedColors: RGB[],
  flavorChunk: FlavorName[],
  contrastLevels: number[],
  availableFlavors: FlavorName[],
  workerIndex: number
): Promise<{ bestMatch: BestFlavorMatch; combinationsTested: number }> {
  
  let bestMatch = {
    flavorName: flavorChunk[0] || availableFlavors[0],
    contrastLevel: 1.0,
    score: Infinity
  };
  
  let combinationsTested = 0;
  
  // Process in smaller batches to avoid blocking the UI
  const batchSize = 50; // Process 50 combinations at a time
  let currentBatch = 0;
  
  for (const flavorName of flavorChunk) {
    for (const contrastLevel of contrastLevels) {
      try {
        const baseTheme = generateThemeFromImageAndFlavor(extractedColors, flavorName);
        const enhancedTheme = generateEnhancedTheme(baseTheme, contrastLevel);
        const enhancedColors = getEnhancedThemeColors(enhancedTheme);
        const mapping = findOptimalColorMapping(extractedColors, enhancedColors);
        const score = calculateMappingScore(extractedColors, enhancedColors, mapping);
        
        combinationsTested++;
        currentBatch++;
        
        if (score < bestMatch.score) {
          bestMatch = { flavorName, contrastLevel, score };
        }
        
        // Yield control back to the browser every batch to prevent blocking
        if (currentBatch >= batchSize) {
          await new Promise(resolve => setTimeout(resolve, 0));
          currentBatch = 0;
        }
        
      } catch (error) {
        continue;
      }
    }
  }
  
  console.log(`Chunk ${workerIndex} completed: tested ${combinationsTested} combinations, best: ${bestMatch.flavorName} @ ${bestMatch.contrastLevel}x (${bestMatch.score.toFixed(2)})`);
  
  return { bestMatch, combinationsTested };
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