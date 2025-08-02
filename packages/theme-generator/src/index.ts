// Color extraction functionality
export {
  extractColorsFromImage,
  rgbToHex,
  cleanupImageUrl,
  type RGB,
  type ColorExtractionResult,
  type ColorExtractionError
} from './colorExtraction';

// Theme generation functionality (no flavors needed)
export {
  generateThemeFromImage,
  getGeneratedThemeColors,
  isPerceptible,
  type GeneratedTheme
} from './themeGeneration';

// Simplified color variants
export {
  generateEnhancedTheme,
  getEnhancedThemeColors,
  type EnhancedTheme,
  type ColorVariant
} from './colorVariants';

// Terminal color pairing
export {
  findOptimalAnsiColorPairing,
  BRIGHT_ANSI_COLORS,
  ANSI_COLOR_NAMES,
  type ColorPairing,
  type OptimalPairingResult
} from './terminalColors';

// Leonardo variants
export {
  generateLeonardoVariants,
  type LeonardoVariant,
  type LeonardoVariantsResult,
  type TerminalColorSet
} from './leonardoVariants'; 