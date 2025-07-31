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

// Future theme generation functionality can be exported here
// export { generateTerminalTheme } from './themeGeneration';
// export { exportTheme } from './themeExport'; 