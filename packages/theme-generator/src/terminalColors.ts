import { differenceCiede2000, parse, hsl, lch } from 'culori';
import { RGB, OkhslColor, okhslToHex, okhslToRgb } from './colorExtraction';

export const deltaE = differenceCiede2000();

/**
 * The 8 base ANSI terminal colors (standard terminal palette)
 */
export const BRIGHT_ANSI_COLORS: RGB[] = [
  [0, 0, 0],       // Black
  [255, 0, 0],     // Red
  [0, 255, 0],     // Green
  [255, 255, 0],   // Yellow
  [0, 0, 255],     // Blue
  [255, 0, 255],   // Magenta
  [0, 255, 255],   // Cyan
  [255, 255, 255], // White
];

export const ANSI_COLOR_NAMES = [
  'Black',
  'Red',
  'Green', 
  'Yellow',
  'Blue',
  'Magenta',
  'Cyan',
  'White'
];

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
 * Calculate hue difference between two RGB colors (0-180, circular)
 */
function calculateHueDifference(color1: RGB, color2: RGB): number {
  const hex1 = rgbToHex(color1);
  const hex2 = rgbToHex(color2);
  
  const hsl1 = hsl(parse(hex1));
  const hsl2 = hsl(parse(hex2));
  
  if (!hsl1 || !hsl2 || hsl1.h === undefined || hsl2.h === undefined) {
    return 0; // No hue difference for achromatic colors
  }
  
  // Calculate circular distance between hues (0-360°)
  const hue1 = hsl1.h;
  const hue2 = hsl2.h;
  
  const diff = Math.abs(hue1 - hue2);
  // Handle circular nature of hue (e.g., 350° and 10° are only 20° apart)
  return Math.min(diff, 360 - diff);
}

/**
 * Calculate perceptual vibrance (chroma) of a color using LCH color space
 * Returns a value from 0-150+ where higher values indicate more vibrant colors
 */
function calculatePerceptualVibrance(color: RGB): number {
  const hex = rgbToHex(color);
  const lchColor = lch(parse(hex));
  
  if (!lchColor || lchColor.c === undefined) {
    throw new Error(`Invalid color for vibrance calculation: RGB(${color.join(',')}) -> ${hex}`);
  }
  
  return lchColor.c; // Chroma in LCH is the perceptual measure of saturation/vibrance
}

/**
 * Calculate perceptual lightness of a color using LCH color space
 * Returns a value from 0-100 where higher values indicate brighter colors
 */
function calculatePerceptualLightness(color: RGB): number {
  const hex = rgbToHex(color);
  const lchColor = lch(parse(hex));
  
  if (!lchColor || lchColor.l === undefined) {
    throw new Error(`Invalid color for lightness calculation: RGB(${color.join(',')}) -> ${hex}`);
  }
  
  return lchColor.l; // Lightness in LCH is the perceptual measure of brightness
}

/**
 * Calculate total distance including vibrance-weighted hue penalty for semantic colors
 * Uses multiplicative relationship: poor hue + low vibrance = much worse penalty
 * Special handling for white color (index 7) with reduced penalties and lightness bonus
 */
function calculateTotalDistance(ansiColor: RGB, extractedColor: RGB, isSemanticColor: boolean, ansiIndex: number): number {
  const perceptualDistance = calculateColorDifference(ansiColor, extractedColor);
  
  if (isSemanticColor) {
    const hueDistance = calculateHueDifference(ansiColor, extractedColor);
    const vibrance = calculatePerceptualVibrance(extractedColor);
    
    // Scale hue distance to be roughly comparable to perceptual distance
    // Hue distance is 0-180, scale it to roughly match CIEDE2000 range
    const baseHuePenalty = (hueDistance / 180) * 50; // Scale to 0-50 range
    
    // Calculate vibrance factor: low vibrance = higher penalty multiplier
    // Vibrance typically ranges 0-150+, normalize to 0-1, then invert for penalty scaling
    const normalizedVibrance = Math.min(vibrance / 150, 1); // 0-1 where 1 = very vibrant
    const vibrancePenaltyMultiplier = 1 + (1 - normalizedVibrance) * 2; // 1.0-3.0 multiplier (less vibrant = higher multiplier)
    
    // Apply multiplicative relationship: poor hue + low vibrance = much worse
    // Good hue + high vibrance = minimal penalty
    const scaledHuePenalty = baseHuePenalty * vibrancePenaltyMultiplier;
    
    // Combine: perceptual distance + vibrance-weighted hue penalty
    const totalDistance = perceptualDistance + scaledHuePenalty;
    
    // Debug logging for semantic color scoring
    const extractedHex = rgbToHex(extractedColor);
    console.log(`Semantic color scoring for ${extractedHex}:`, {
      perceptualDistance: perceptualDistance.toFixed(2),
      hueDistance: hueDistance.toFixed(1),
      baseHuePenalty: baseHuePenalty.toFixed(2),
      vibrance: vibrance.toFixed(1),
      normalizedVibrance: normalizedVibrance.toFixed(2),
      vibrancePenaltyMultiplier: vibrancePenaltyMultiplier.toFixed(2),
      scaledHuePenalty: scaledHuePenalty.toFixed(2),
      totalDistance: totalDistance.toFixed(2)
    });
    
    return totalDistance;
  }
  
  // Special handling for white color (ANSI index 7)
  if (ansiIndex === 7) {
    const lightness = calculatePerceptualLightness(extractedColor);
    
    // Reduce base penalty by dividing by 3
    const reducedDistance = perceptualDistance / 3;
    
    // Add lightness bonus: brighter colors get lower penalties
    // Lightness ranges 0-100, normalize and scale to 0-15 bonus
    const normalizedLightness = Math.min(lightness / 100, 1); // 0-1 where 1 = very bright
    const lightnessBonus = normalizedLightness * 15; // Brighter = larger bonus (penalty reduction)
    
    const finalDistance = Math.max(reducedDistance - lightnessBonus, 0);
    
    // Debug logging for white color scoring
    const extractedHex = rgbToHex(extractedColor);
    console.log(`White color scoring for ${extractedHex}:`, {
      perceptualDistance: perceptualDistance.toFixed(2),
      reducedDistance: reducedDistance.toFixed(2),
      lightness: lightness.toFixed(1),
      normalizedLightness: normalizedLightness.toFixed(2),
      lightnessBonus: lightnessBonus.toFixed(2),
      finalDistance: finalDistance.toFixed(2)
    });
    
    return finalDistance;
  }
  
  return perceptualDistance;
}

/**
 * Result of finding optimal color pairing
 */
export interface ColorPairing {
  ansiColor: RGB;
  ansiColorName: string;
  extractedColor: RGB;
  extractedColorHex: string;
  perceptualDistance: number;
}

export interface OptimalPairingResult {
  pairings: ColorPairing[];
  totalDistance: number;
  selectedIndices: number[]; // Which indices from extractedColors were used
}

/**
 * Generate all combinations of k elements from an array
 */
function* combinations<T>(array: T[], k: number): Generator<T[]> {
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
 * Find optimal assignment using Hungarian-style greedy approach
 * Adds hue difference penalty for semantic colors (Red, Green, Yellow)
 */
function findOptimalAssignment(selectedColors: RGB[], ansiColors: RGB[]): { mapping: number[], totalDistance: number } {
  const numColors = selectedColors.length; // Should be 8
  
  // Semantic color indices (Red=1, Green=2, Yellow=3) get hue penalty
  const SEMANTIC_INDICES = new Set([1, 2, 3]); // Red, Green, Yellow
  
  // Calculate all pairwise distances with hue penalty for semantic colors
  const distances: number[][] = [];
  for (let ansiIndex = 0; ansiIndex < numColors; ansiIndex++) {
    distances[ansiIndex] = [];
    for (let selectedIndex = 0; selectedIndex < numColors; selectedIndex++) {
      const isSemanticColor = SEMANTIC_INDICES.has(ansiIndex);
      const distance = calculateTotalDistance(ansiColors[ansiIndex], selectedColors[selectedIndex], isSemanticColor, ansiIndex);
      distances[ansiIndex][selectedIndex] = distance;
    }
  }
  
  // Greedy assignment 
  const mapping: number[] = new Array(numColors);
  const usedSelectedColors = new Set<number>();
  let totalDistance = 0;
  
  for (let ansiIndex = 0; ansiIndex < numColors; ansiIndex++) {
    let bestSelectedIndex = -1;
    let bestDistance = Infinity;
    
    for (let selectedIndex = 0; selectedIndex < numColors; selectedIndex++) {
      if (!usedSelectedColors.has(selectedIndex)) {
        const distance = distances[ansiIndex][selectedIndex];
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSelectedIndex = selectedIndex;
        }
      }
    }
    
    if (bestSelectedIndex !== -1) {
      mapping[ansiIndex] = bestSelectedIndex;
      usedSelectedColors.add(bestSelectedIndex);
      totalDistance += bestDistance;
    }
  }
  
  return { mapping, totalDistance };
}

/**
 * Find the optimal pairing of 8 extracted colors with 8 ANSI colors
 * Tests all combinations of 8 from 16 extracted colors to minimize perceptual distance
 */
export function findOptimalAnsiColorPairing(extractedColors: OkhslColor[]): OptimalPairingResult {
  if (extractedColors.length < 8) {
    throw new Error(`Expected at least 8 extracted colors, got ${extractedColors.length}`);
  }
  
  console.log(`Finding optimal ANSI color pairing from ${extractedColors.length} extracted colors...`);
  
  let bestTotalDistance = Infinity;
  let bestMapping: number[] = [];
  let bestSelectedIndices: number[] = [];
  
  const extractedIndices = Array.from({length: extractedColors.length}, (_, i) => i);
  let combinationCount = 0;
  
  // Test all combinations of 8 colors from the extracted colors
  for (const selectedIndices of combinations(extractedIndices, 8)) {
    combinationCount++;
    
    // Get the actual color values for this combination and convert to RGB for distance calculation
    const selectedColors = selectedIndices.map(index => okhslToRgb(extractedColors[index]));
    
    // Find optimal assignment for this specific 8-color selection
    const { mapping, totalDistance } = findOptimalAssignment(selectedColors, BRIGHT_ANSI_COLORS);
    
    // Check if this is the best combination so far
    if (totalDistance < bestTotalDistance) {
      bestTotalDistance = totalDistance;
      bestMapping = mapping;
      bestSelectedIndices = [...selectedIndices];
    }
  }
  
  console.log(`Tested ${combinationCount} combinations, best total distance: ${bestTotalDistance.toFixed(2)}`);
  
  // Create the final pairings
  const pairings: ColorPairing[] = [];
  for (let ansiIndex = 0; ansiIndex < BRIGHT_ANSI_COLORS.length; ansiIndex++) {
    const localSelectedIndex = bestMapping[ansiIndex];
    const globalExtractedIndex = bestSelectedIndices[localSelectedIndex];
    const extractedOkhslColor = extractedColors[globalExtractedIndex];
    const extractedColor = okhslToRgb(extractedOkhslColor);
    
    // Calculate the actual perceptual distance (without semantic weighting for display)
    const actualDistance = calculateColorDifference(BRIGHT_ANSI_COLORS[ansiIndex], extractedColor);
    
    pairings.push({
      ansiColor: BRIGHT_ANSI_COLORS[ansiIndex],
      ansiColorName: ANSI_COLOR_NAMES[ansiIndex],
      extractedColor: extractedColor,
      extractedColorHex: rgbToHex(extractedColor),
      perceptualDistance: actualDistance // Show actual distance, not weighted
    });
  }
  
  return {
    pairings,
    totalDistance: bestTotalDistance,
    selectedIndices: bestSelectedIndices
  };
}