import { BackgroundColor, Color, Theme, type CssColor } from '@adobe/leonardo-contrast-colors';
import { formatHex, oklch, parse } from 'culori';
import { RGB } from './colorExtraction';
import { GeneratedTheme } from './themeGeneration';
import { FlavorScheme } from './flavors';

/**
 * Color variant with contrast information
 */
export interface ColorVariant {
  hex: string;
  rgb: RGB;
  contrast: number;
  wcagLevel: 'AAA+' | 'AAA' | 'AA' | 'A' | 'fail';
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
function getWcagLevel(contrast: number): 'AAA+' | 'AAA' | 'AA' | 'A' | 'fail' {
  if (contrast >= 12) return 'AAA+'; // Very high contrast
  if (contrast >= 7) return 'AAA';
  if (contrast >= 4.5) return 'AA';
  if (contrast >= 3) return 'A'; // Basic readability
  return 'fail';
}

/**
 * Generate color variants using Leonardo contrast algorithms
 */
function generateColorVariants(
  colorHex: string, 
  backgroundHex: string, 
  variantCount: number,
  contrastMultiplier: number = 1.0
): ColorVariant[] {
  console.log(`Generating variants for ${colorHex} on ${backgroundHex}`);
  
  try {
    // Define base target contrast ratios based on variant count
    const baseRatios = variantCount === 8 
      ? [1.5, 2, 3, 4.5, 6, 7, 9, 12] // Foreground variants (more granular)
      : [2, 4.5, 7, 12]; // Other color variants
    
    // Apply contrast multiplier to ratios, ensuring minimum of 0.1 for readability
    const ratios = baseRatios.map(ratio => Math.max(0.1, ratio * contrastMultiplier));

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

    // Extract variants from Leonardo output structure
    // Leonardo returns an array of color objects, find our 'variants' color
    const variantsColorObject = output.find((colorObj: any) => colorObj.name === 'variants') as any;
    
    if (variantsColorObject && variantsColorObject.values) {
      console.log('Found variants color object with values:', variantsColorObject.values);
      
      // Extract each generated color from the values array
      for (const valueObj of variantsColorObject.values) {
        const generatedHex = valueObj.value;
        const actualContrast = valueObj.contrast;
        
        console.log(`Leonardo generated: ${generatedHex} with contrast ${actualContrast}`);
        
        if (generatedHex && generatedHex.startsWith('#')) {
          variants.push({
            hex: generatedHex,
            rgb: hexToRgb(generatedHex),
            contrast: actualContrast,
            wcagLevel: getWcagLevel(actualContrast)
          });
        }
      }
    } else {
      console.warn('No variants color object found in Leonardo output:', output);
    }

    console.log(`Generated ${variants.length} Leonardo variants`);
    
    // Leonardo should always generate valid variants when used correctly
    if (variants.length === 0) {
      throw new Error(`Leonardo failed to generate any variants! This indicates a serious issue.
Input color: ${colorHex}, Background: ${backgroundHex}, Ratios: ${ratios}
Leonardo output: ${JSON.stringify(output, null, 2)}`);
    }

    return variants;
  } catch (error) {
    console.error('Leonardo generation failed completely:', error);
    console.error('Input parameters:', { colorHex, backgroundHex, variantCount, contrastMultiplier });
    
    // Only use fallback for truly exceptional cases (e.g., invalid color inputs, Leonardo bugs)
    console.warn('Using fallback color generation due to Leonardo failure');
    return generateFallbackVariants(colorHex, backgroundHex, variantCount, contrastMultiplier);
  }
}

/**
 * Fallback variant generation using OKLCH interpolation
 */
function generateFallbackVariants(
  colorHex: string, 
  backgroundHex: string, 
  variantCount: number,
  contrastMultiplier: number = 1.0
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
  const baseRatios = variantCount === 8 
    ? [1.5, 2, 3, 4.5, 6, 7, 9, 12]
    : [2, 4.5, 7, 12];
  
  // Apply contrast multiplier to ratios, ensuring minimum of 0.1 for readability  
  const targetRatios = baseRatios.map(ratio => Math.max(0.1, ratio * contrastMultiplier));

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
export function generateEnhancedTheme(baseTheme: GeneratedTheme, contrastMultiplier: number = 1.0): EnhancedTheme {
  console.time('generateEnhancedTheme');
  
  const backgroundHex = `#${baseTheme.base00}`;
  const foregroundHex = `#${baseTheme.base05}`;
  
  // Generate 8 foreground variants
  const foregroundVariants = generateColorVariants(foregroundHex, backgroundHex, 8, contrastMultiplier);
  
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
    const variants = generateColorVariants(colorHex, backgroundHex, 4, contrastMultiplier);
    
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