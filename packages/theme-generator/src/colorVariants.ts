import { BackgroundColor, Color, Theme, type CssColor } from '@adobe/leonardo-contrast-colors';
import { formatHex, oklch, parse } from 'culori';
import { RGB } from './colorExtraction';
import { GeneratedTheme } from './themeGeneration';

/**
 * Color variant with contrast information
 */
export interface ColorVariant {
  hex: string;
  rgb: RGB;
  contrast: number;
  wcagLevel: 'AA' | 'AAA' | 'fail';
}

/**
 * Color with multiple variants
 */
export interface ColorWithVariants {
  baseHex: string;
  baseName: string;
  baseDescription: string;
  variants: ColorVariant[];
}

/**
 * Enhanced theme with color variants
 */
export interface EnhancedTheme extends GeneratedTheme {
  backgroundHex: string;
  foregroundVariants: ColorVariant[]; // 8 variants
  colorVariants: ColorWithVariants[]; // 15 colors with 4 variants each
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

/**
 * Get WCAG compliance level for contrast ratio
 */
function getWcagLevel(contrast: number): 'AA' | 'AAA' | 'fail' {
  if (contrast >= 7) return 'AAA';
  if (contrast >= 4.5) return 'AA';
  return 'fail';
}

/**
 * Generate color variants using Leonardo contrast algorithms
 */
function generateColorVariants(
  colorHex: string, 
  backgroundHex: string, 
  variantCount: number
): ColorVariant[] {
  console.log(`Generating variants for ${colorHex} on ${backgroundHex}`);
  
  try {
    // Define target contrast ratios based on variant count
    const ratios = variantCount === 8 
      ? [1.5, 2, 3, 4.5, 6, 7, 9, 12] // Foreground variants (more granular)
      : [2, 4.5, 7, 12]; // Other color variants

    // Create Leonardo background
    const background = new BackgroundColor({
      name: 'background',
      colorKeys: [backgroundHex as CssColor],
      ratios: [1]
    });

    // Create color for variant generation
    const leonardoColor = new Color({
      name: 'variants',
      colorKeys: [colorHex as CssColor],
      ratios
    });

    // Create theme and generate variants
    const theme = new Theme({
      colors: [leonardoColor],
      backgroundColor: background,
      lightness: 50
    });

    const output = theme.contrastColors;
    console.log('Leonardo output:', output);
    
    const variants: ColorVariant[] = [];

    // Extract variants from Leonardo output
    for (const ratio of ratios) {
      const colorName = `variants${Math.round(ratio * 100)}`;
      const generatedHex = (output as any)[colorName] as string;
      
      console.log(`Looking for ${colorName}, found: ${generatedHex}`);
      
      if (generatedHex && generatedHex.startsWith('#')) {
        variants.push({
          hex: generatedHex,
          rgb: hexToRgb(generatedHex),
          contrast: ratio,
          wcagLevel: getWcagLevel(ratio)
        });
      }
    }

    console.log(`Generated ${variants.length} Leonardo variants`);
    
    if (variants.length === 0) {
      console.warn('No valid Leonardo variants generated, falling back');
      return generateFallbackVariants(colorHex, backgroundHex, variantCount);
    }

    return variants;
  } catch (error) {
    console.warn('Leonardo generation failed, falling back to manual interpolation:', error);
    return generateFallbackVariants(colorHex, backgroundHex, variantCount);
  }
}

/**
 * Fallback variant generation using OKLCH interpolation
 */
function generateFallbackVariants(
  colorHex: string, 
  backgroundHex: string, 
  variantCount: number
): ColorVariant[] {
  console.log(`Fallback generation for ${colorHex} on ${backgroundHex}`);
  
  const baseColor = parse(colorHex);
  const backgroundColor = parse(backgroundHex);
  
  if (!baseColor || !backgroundColor) {
    console.warn('Could not parse colors for fallback');
    return [];
  }

  const baseOklch = oklch(baseColor);
  const bgOklch = oklch(backgroundColor);
  
  if (!baseOklch || !bgOklch) {
    console.warn('Could not convert to OKLCH for fallback');
    return [];
  }

  const variants: ColorVariant[] = [];
  const targetRatios = variantCount === 8 
    ? [1.5, 2, 3, 4.5, 6, 7, 9, 12]
    : [2, 4.5, 7, 12];

  const baseLightness = baseOklch.l || 0.5;
  const bgLightness = bgOklch.l || 0.5;
  
  for (const targetRatio of targetRatios) {
    // Create variants by adjusting lightness
    // For higher contrast ratios, move further away from background lightness
    let adjustedLightness: number;
    
    if (baseLightness > bgLightness) {
      // Base is lighter than background, make it even lighter for higher contrast
      adjustedLightness = Math.min(1, baseLightness + (targetRatio - 1) * 0.1);
    } else {
      // Base is darker than background, make it even darker for higher contrast
      adjustedLightness = Math.max(0, baseLightness - (targetRatio - 1) * 0.1);
    }

    const variantColor = {
      ...baseOklch,
      l: adjustedLightness
    };

    const variantHex = formatHex(variantColor);
    
    if (variantHex) {
      variants.push({
        hex: variantHex,
        rgb: hexToRgb(variantHex),
        contrast: targetRatio,
        wcagLevel: getWcagLevel(targetRatio)
      });
    }
  }

  console.log(`Generated ${variants.length} fallback variants`);
  return variants;
}

/**
 * Generate enhanced theme with color variants
 */
export function generateEnhancedTheme(baseTheme: GeneratedTheme): EnhancedTheme {
  console.time('generateEnhancedTheme');
  
  const backgroundHex = `#${baseTheme.base00}`;
  const foregroundHex = `#${baseTheme.base05}`;
  
  // Generate 8 foreground variants
  const foregroundVariants = generateColorVariants(foregroundHex, backgroundHex, 8);
  
  // Base16 color information
  const colorInfo = [
    { key: 'base01', name: 'Lighter Background', description: 'Status lines, lighter backgrounds' },
    { key: 'base02', name: 'Selection Background', description: 'Selection, find highlights' },
    { key: 'base03', name: 'Comments', description: 'Comments, invisibles, line highlighting' },
    { key: 'base04', name: 'Dark Foreground', description: 'Status line text, dark foreground' },
    { key: 'base06', name: 'Light Foreground', description: 'Light foreground (rarely used)' },
    { key: 'base07', name: 'Light Background', description: 'Light background (rarely used)' },
    { key: 'base08', name: 'Variables', description: 'Variables, XML tags, markup links, lists' },
    { key: 'base09', name: 'Integers', description: 'Integers, booleans, constants, attributes' },
    { key: 'base0A', name: 'Classes', description: 'Classes, markup bold, search highlights' },
    { key: 'base0B', name: 'Strings', description: 'Strings, inherited class, markup code' },
    { key: 'base0C', name: 'Support', description: 'Regular expressions, escape characters' },
    { key: 'base0D', name: 'Functions', description: 'Functions, methods, IDs, headings' },
    { key: 'base0E', name: 'Keywords', description: 'Keywords, storage, selectors, markup italic' },
    { key: 'base0F', name: 'Deprecated', description: 'Deprecated, embedded language tags' }
  ];
  
  // Generate 4 variants for each other color
  const colorVariants: ColorWithVariants[] = colorInfo.map(info => {
    const colorHex = `#${(baseTheme as any)[info.key]}`;
    const variants = generateColorVariants(colorHex, backgroundHex, 4);
    
    return {
      baseHex: colorHex,
      baseName: info.name,
      baseDescription: info.description,
      variants
    };
  });
  
  console.timeEnd('generateEnhancedTheme');
  
  return {
    ...baseTheme,
    backgroundHex,
    foregroundVariants,
    colorVariants
  };
}

/**
 * Get all colors from enhanced theme as flat array
 */
export function getEnhancedThemeColors(enhancedTheme: EnhancedTheme): RGB[] {
  const colors: RGB[] = [];
  
  // Add background
  colors.push(hexToRgb(enhancedTheme.backgroundHex));
  
  // Add foreground variants
  enhancedTheme.foregroundVariants.forEach(variant => {
    colors.push(variant.rgb);
  });
  
  // Add color variants
  enhancedTheme.colorVariants.forEach(colorGroup => {
    colorGroup.variants.forEach(variant => {
      colors.push(variant.rgb);
    });
  });
  
  return colors;
}