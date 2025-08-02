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
 * Generate all combinations of selecting k items from n items
 */
function* generateCombinations<T>(array: T[], k: number): Generator<T[]> {
  const n = array.length;
  if (k > n) return;
  if (k === 0) {
    yield [];
    return;
  }
  
  const indices = Array.from({length: k}, (_, i) => i);
  yield indices.map(i => array[i]);
  
  while (true) {
    let i = k - 1;
    while (i >= 0 && indices[i] === n - k + i) {
      i--;
    }
    
    if (i < 0) break;
    
    indices[i]++;
    for (let j = i + 1; j < k; j++) {
      indices[j] = indices[j - 1] + 1;
    }
    
    yield indices.map(i => array[i]);
  }
}

/**
 * Find optimal assignment between selected colors and flavor colors using Hungarian-style approach
 */
function findOptimalAssignment(selectedColors: RGB[], flavorColors: RGB[]): { mapping: number[], totalDistance: number } {
  const numColors = selectedColors.length; // Should be 16
  
  // Calculate all pairwise distances
  const distances: number[][] = [];
  for (let flavorIndex = 0; flavorIndex < numColors; flavorIndex++) {
    distances[flavorIndex] = [];
    for (let selectedIndex = 0; selectedIndex < numColors; selectedIndex++) {
      distances[flavorIndex][selectedIndex] = calculateColorDifference(flavorColors[flavorIndex], selectedColors[selectedIndex]);
    }
  }
  
  // For 16x16 assignment, we use a greedy approach (Hungarian algorithm would be overkill)
  // Since we're already doing exhaustive search on combinations
  const mapping: number[] = new Array(numColors);
  const usedSelectedColors = new Set<number>();
  let totalDistance = 0;
  
  // Greedy assignment within this specific 16-color selection
  for (let flavorIndex = 0; flavorIndex < numColors; flavorIndex++) {
    let bestSelectedIndex = -1;
    let bestDistance = Infinity;
    
    for (let selectedIndex = 0; selectedIndex < numColors; selectedIndex++) {
      if (!usedSelectedColors.has(selectedIndex)) {
        const distance = distances[flavorIndex][selectedIndex];
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSelectedIndex = selectedIndex;
        }
      }
    }
    
    if (bestSelectedIndex !== -1) {
      mapping[flavorIndex] = bestSelectedIndex;
      usedSelectedColors.add(bestSelectedIndex);
      totalDistance += bestDistance;
    }
  }
  
  return { mapping, totalDistance };
}

/**
 * Find optimal combination of 16 colors from 20 extracted colors and their assignment to flavor colors
 * Returns the mapping from flavor positions to extracted color indices
 */
function findOptimalColorMapping(extractedColors: RGB[], flavorColors: RGB[]): number[] {
  if (extractedColors.length !== 20) {
    throw new Error(`Expected exactly 20 extracted colors, got ${extractedColors.length}`);
  }
  if (flavorColors.length !== 16) {
    throw new Error(`Expected exactly 16 flavor colors, got ${flavorColors.length}`);
  }
  
  let bestTotalDistance = Infinity;
  let bestMapping: number[] = [];
  let bestSelectedIndices: number[] = [];
  
  console.log('Starting exhaustive search: testing all C(20,16) = 4845 combinations...');
  
  let combinationCount = 0;
  const extractedIndices = Array.from({length: 20}, (_, i) => i);
  
  // Generate all combinations of 16 colors from 20
  for (const selectedIndices of generateCombinations(extractedIndices, 16)) {
    combinationCount++;
    
    // Get the actual color values for this combination
    const selectedColors = selectedIndices.map(index => extractedColors[index]);
    
    // Find optimal assignment for this specific 16-color selection
    const { mapping, totalDistance } = findOptimalAssignment(selectedColors, flavorColors);
    
    // Check if this is the best combination so far
    if (totalDistance < bestTotalDistance) {
      bestTotalDistance = totalDistance;
      bestMapping = mapping;
      bestSelectedIndices = [...selectedIndices];
    }
  }
  
  console.log(`Tested ${combinationCount} combinations, best total distance: ${bestTotalDistance.toFixed(2)}`);
  
  // Convert local mapping (within selected 16) to global mapping (within all 20)
  const globalMapping = bestMapping.map(localIndex => bestSelectedIndices[localIndex]);
  
  return globalMapping;
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
  
  // Ensure we have exactly 20 colors for exhaustive search
  let workingColors = [...extractedColors];
  if (workingColors.length !== 20) {
    throw new Error(`Expected exactly 20 extracted colors for exhaustive search, got ${workingColors.length}`);
  }
  
  console.time('findOptimalMapping');
  // Find optimal mapping using exhaustive search - this will test all combinations
  const mapping = findOptimalColorMapping(workingColors, flavorColors);
  console.timeEnd('findOptimalMapping');
  
  const mappingScore = calculateMappingScore(workingColors, flavorColors, mapping);
  
  // Create the theme using mapped colors
  const mappedColors = mapping.map(index => rgbToHex(workingColors[index]));
  
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
  console.log(`Finding best matching flavor from ${availableFlavors.length} flavors for ${extractedColors.length} extracted colors`);
  
  if (extractedColors.length !== 20) {
    throw new Error(`Expected exactly 20 extracted colors for exhaustive search, got ${extractedColors.length}`);
  }

  let bestMatch: BestFlavorMatch = {
    flavorName: availableFlavors[0],
    score: Infinity
  };

  let flavorsTested = 0;
  
  // Test each flavor using exhaustive combination search
  for (const flavorName of availableFlavors) {
    flavorsTested++;
    console.log(`Testing flavor ${flavorsTested}/${availableFlavors.length}: ${flavorName}`);
    
    try {
      const flavorColors = getFlavorColors(flavorName);
      
      // This will do exhaustive search for this flavor
      const mapping = findOptimalColorMapping(extractedColors, flavorColors);
      const score = calculateMappingScore(extractedColors, flavorColors, mapping);
      
      if (score < bestMatch.score) {
        bestMatch = {
          flavorName,
          score
        };
        console.log(`New best flavor: ${flavorName} with score ${score.toFixed(2)}`);
      }
    } catch (error) {
      console.warn(`Failed to test flavor ${flavorName}:`, error);
    }
  }

  console.log(`Exhaustive search complete. Best flavor: ${bestMatch.flavorName} with score ${bestMatch.score.toFixed(2)}`);
  console.timeEnd('findBestMatchingFlavor');
  return bestMatch;
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