// Color extraction functionality
export {
  extractColorsFromImage,
  rgbToHex,
  cleanupImageUrl,
  type RGB,
  type ColorExtractionResult,
  type ColorExtractionError
} from './colorExtraction';

// Flavor functionality
export {
  getAvailableFlavors,
  getFlavor,
  getFlavorColors,
  getFlavorMetadata,
  searchFlavors,
  type FlavorScheme,
  type FlavorName
} from './flavors';

// Theme generation functionality
export {
  generateThemeFromImageAndFlavor,
  getGeneratedThemeColors,
  findBestMatchingFlavor,
  isPerceptible,
  type GeneratedTheme
} from './themeGeneration';

// Color variants with Leonardo contrast
export {
  generateEnhancedTheme,
  getEnhancedThemeColors,
  type EnhancedTheme,
  type ColorVariant,
  type ColorWithVariants
} from './colorVariants'; 