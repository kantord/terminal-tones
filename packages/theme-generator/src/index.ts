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
  type GeneratedTheme,
  type BestFlavorMatch
} from './themeGeneration';

// Simplified color variants
export {
  generateEnhancedTheme,
  getEnhancedThemeColors,
  type EnhancedTheme,
  type ColorVariant
} from './colorVariants'; 