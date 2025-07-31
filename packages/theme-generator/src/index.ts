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
  type FlavorScheme,
  type FlavorName
} from './flavors';

// Theme generation functionality
export {
  generateThemeFromImageAndFlavor,
  getGeneratedThemeColors,
  isPerceptible,
  type GeneratedTheme
} from './themeGeneration'; 